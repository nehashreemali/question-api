/**
 * NCERT Adapter
 *
 * Fetches educational content aligned with NCERT curriculum.
 * Uses Wikipedia with NCERT-specific context and curriculum mapping.
 *
 * Supports:
 * - Class 10 Science (Physics, Chemistry, Biology)
 * - Class 12 Physics, Chemistry, Biology, Mathematics
 */

import axios from 'axios';
import type { ContentAdapter, ContentResult, FetchOptions, Citation } from './types';
import { createLogger } from '../logger';

const logger = createLogger('ncert-adapter');

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1';

// NCERT curriculum mapping - topics to Wikipedia articles with educational context
const NCERT_MAPPINGS: Record<string, { articles: string[]; class: string; subject: string }> = {
  // Class 10 Science - Physics
  'light-reflection-refraction': {
    articles: ['Reflection (physics)', 'Refraction', 'Mirror', 'Lens'],
    class: '10',
    subject: 'Physics',
  },
  'human-eye': {
    articles: ['Human eye', 'Corrective lens', 'Myopia', 'Hypermetropia'],
    class: '10',
    subject: 'Physics',
  },
  'electricity': {
    articles: ['Electric current', 'Ohm\'s law', 'Electric resistance', 'Electric power'],
    class: '10',
    subject: 'Physics',
  },
  'magnetic-effects': {
    articles: ['Electromagnetism', 'Magnetic field', 'Electric motor', 'Electromagnetic induction'],
    class: '10',
    subject: 'Physics',
  },

  // Class 10 Science - Chemistry
  'chemical-reactions': {
    articles: ['Chemical reaction', 'Redox', 'Decomposition reaction', 'Displacement reaction'],
    class: '10',
    subject: 'Chemistry',
  },
  'acids-bases-salts': {
    articles: ['Acid', 'Base (chemistry)', 'Salt (chemistry)', 'pH'],
    class: '10',
    subject: 'Chemistry',
  },
  'metals-nonmetals': {
    articles: ['Metal', 'Nonmetal', 'Metallurgy', 'Corrosion'],
    class: '10',
    subject: 'Chemistry',
  },
  'carbon-compounds': {
    articles: ['Carbon', 'Organic compound', 'Hydrocarbon', 'Functional group'],
    class: '10',
    subject: 'Chemistry',
  },
  'periodic-classification': {
    articles: ['Periodic table', 'Chemical element', 'Dmitri Mendeleev', 'Periodic trends'],
    class: '10',
    subject: 'Chemistry',
  },

  // Class 10 Science - Biology
  'life-processes': {
    articles: ['Metabolism', 'Nutrition (animals)', 'Respiration (physiology)', 'Excretion'],
    class: '10',
    subject: 'Biology',
  },
  'control-coordination': {
    articles: ['Nervous system', 'Endocrine system', 'Hormone', 'Reflex arc'],
    class: '10',
    subject: 'Biology',
  },
  'reproduction': {
    articles: ['Reproduction', 'Sexual reproduction', 'Asexual reproduction', 'Human reproductive system'],
    class: '10',
    subject: 'Biology',
  },
  'heredity-evolution': {
    articles: ['Heredity', 'Evolution', 'Genetics', 'Natural selection'],
    class: '10',
    subject: 'Biology',
  },

  // Class 12 Physics
  'electrostatics': {
    articles: ['Electrostatics', 'Coulomb\'s law', 'Electric field', 'Electric potential'],
    class: '12',
    subject: 'Physics',
  },
  'current-electricity': {
    articles: ['Electric current', 'Kirchhoff\'s circuit laws', 'Wheatstone bridge', 'Potentiometer'],
    class: '12',
    subject: 'Physics',
  },
  'magnetism': {
    articles: ['Magnetism', 'Biot–Savart law', 'Ampère\'s circuital law', 'Magnetic dipole'],
    class: '12',
    subject: 'Physics',
  },
  'electromagnetic-induction': {
    articles: ['Electromagnetic induction', 'Faraday\'s law of induction', 'Lenz\'s law', 'Inductance'],
    class: '12',
    subject: 'Physics',
  },
  'optics': {
    articles: ['Optics', 'Wave interference', 'Diffraction', 'Polarization (waves)'],
    class: '12',
    subject: 'Physics',
  },
  'modern-physics': {
    articles: ['Photoelectric effect', 'Bohr model', 'Radioactive decay', 'Nuclear fission'],
    class: '12',
    subject: 'Physics',
  },
  'semiconductors': {
    articles: ['Semiconductor', 'P–n junction', 'Transistor', 'Logic gate'],
    class: '12',
    subject: 'Physics',
  },

  // Class 12 Chemistry
  'solid-state': {
    articles: ['Solid-state chemistry', 'Crystal structure', 'Unit cell', 'Crystal defect'],
    class: '12',
    subject: 'Chemistry',
  },
  'solutions': {
    articles: ['Solution (chemistry)', 'Colligative properties', 'Raoult\'s law', 'Osmosis'],
    class: '12',
    subject: 'Chemistry',
  },
  'electrochemistry': {
    articles: ['Electrochemistry', 'Electrochemical cell', 'Electrolysis', 'Nernst equation'],
    class: '12',
    subject: 'Chemistry',
  },
  'chemical-kinetics': {
    articles: ['Chemical kinetics', 'Reaction rate', 'Rate equation', 'Activation energy'],
    class: '12',
    subject: 'Chemistry',
  },
  'coordination-compounds': {
    articles: ['Coordination complex', 'Ligand', 'Crystal field theory', 'Isomerism'],
    class: '12',
    subject: 'Chemistry',
  },
  'organic-chemistry': {
    articles: ['Organic chemistry', 'Alcohol', 'Aldehyde', 'Carboxylic acid'],
    class: '12',
    subject: 'Chemistry',
  },
  'polymers': {
    articles: ['Polymer', 'Polymerization', 'Thermoplastic', 'Biodegradable plastic'],
    class: '12',
    subject: 'Chemistry',
  },

  // Class 12 Biology
  'reproduction-organisms': {
    articles: ['Reproduction', 'Gamete', 'Fertilisation', 'Embryo'],
    class: '12',
    subject: 'Biology',
  },
  'human-reproduction': {
    articles: ['Human reproduction', 'Menstrual cycle', 'Pregnancy', 'Embryonic development'],
    class: '12',
    subject: 'Biology',
  },
  'genetics-molecular-biology': {
    articles: ['Molecular biology', 'DNA replication', 'Transcription (biology)', 'Translation (biology)'],
    class: '12',
    subject: 'Biology',
  },
  'biotechnology': {
    articles: ['Biotechnology', 'Genetic engineering', 'Recombinant DNA', 'Polymerase chain reaction'],
    class: '12',
    subject: 'Biology',
  },
  'ecology': {
    articles: ['Ecology', 'Ecosystem', 'Food chain', 'Biodiversity'],
    class: '12',
    subject: 'Biology',
  },

  // Class 12 Mathematics
  'matrices': {
    articles: ['Matrix (mathematics)', 'Determinant', 'Inverse matrix', 'Matrix multiplication'],
    class: '12',
    subject: 'Mathematics',
  },
  'calculus': {
    articles: ['Calculus', 'Derivative', 'Integral', 'Differential equation'],
    class: '12',
    subject: 'Mathematics',
  },
  'vectors': {
    articles: ['Euclidean vector', 'Dot product', 'Cross product', 'Vector space'],
    class: '12',
    subject: 'Mathematics',
  },
  'probability': {
    articles: ['Probability', 'Bayes\' theorem', 'Random variable', 'Probability distribution'],
    class: '12',
    subject: 'Mathematics',
  },
  'linear-programming': {
    articles: ['Linear programming', 'Simplex algorithm', 'Optimization problem'],
    class: '12',
    subject: 'Mathematics',
  },
};

export class NCERTAdapter implements ContentAdapter {
  name = 'ncert-adapter';

  canHandle(options: FetchOptions): boolean {
    // Handle science and mathematics categories
    return ['science', 'mathematics'].includes(options.category);
  }

  async fetch(options: FetchOptions): Promise<ContentResult> {
    const { topic, subcategory, category } = options;

    logger.info(`Fetching NCERT-aligned content for: ${topic}`);

    const mapping = NCERT_MAPPINGS[topic];

    if (!mapping) {
      logger.warn(`No NCERT mapping found for topic: ${topic}, falling back to generic fetch`);
      return this.fetchGeneric(topic, category, subcategory);
    }

    const citations: Citation[] = [];
    const contents: string[] = [];

    // Add NCERT context header
    contents.push(`**NCERT Curriculum: Class ${mapping.class} ${mapping.subject}**\n`);

    for (const article of mapping.articles) {
      try {
        const result = await this.fetchArticle(article);
        if (result) {
          contents.push(`## ${article}\n\n${result.content}`);
          citations.push({
            text: article,
            source: 'Wikipedia (NCERT-aligned)',
            url: result.url,
          });
        }
      } catch (error: any) {
        logger.warn(`Failed to fetch article "${article}": ${error.message}`);
      }
    }

    if (contents.length <= 1) {
      throw new Error(`No NCERT content found for topic: ${topic}`);
    }

    const topicName = this.formatTopicName(topic);

    return {
      title: `${topicName} (NCERT Class ${mapping.class})`,
      content: contents.join('\n\n---\n\n'),
      source: `NCERT Class ${mapping.class} ${mapping.subject} (via Wikipedia)`,
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(mapping.articles[0])}`,
      fetchedAt: new Date().toISOString(),
      citations,
      metadata: {
        category,
        subcategory,
        topic,
        ncertClass: mapping.class,
        ncertSubject: mapping.subject,
        articleCount: contents.length - 1, // Subtract header
      },
    };
  }

  private async fetchGeneric(topic: string, category: string, subcategory?: string): Promise<ContentResult> {
    const articleName = topic
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const result = await this.fetchArticle(articleName);

    if (!result) {
      throw new Error(`No content found for topic: ${topic}`);
    }

    return {
      title: articleName,
      content: result.content,
      source: 'Wikipedia',
      sourceUrl: result.url,
      fetchedAt: new Date().toISOString(),
      citations: [{
        text: articleName,
        source: 'Wikipedia',
        url: result.url,
      }],
      metadata: {
        category,
        subcategory,
        topic,
      },
    };
  }

  private async fetchArticle(title: string): Promise<{ content: string; url: string } | null> {
    const url = `${WIKI_API}/page/summary/${encodeURIComponent(title)}`;

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'QuizGenerator/1.0 (educational project)',
        },
      });

      const data = response.data;
      let content = data.extract || '';

      // Get more content from sections
      try {
        const sectionsUrl = `${WIKI_API}/page/mobile-sections/${encodeURIComponent(title)}`;
        const sectionsResponse = await axios.get(sectionsUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'QuizGenerator/1.0 (educational project)',
          },
        });

        const sections = sectionsResponse.data.remaining?.sections || [];
        for (const section of sections.slice(0, 5)) {
          if (section.text) {
            const text = section.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.length > 100) {
              content += `\n\n### ${section.line}\n${text}`;
            }
          }
        }
      } catch {
        // Ignore sections fetch failure
      }

      return {
        content,
        url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Wikipedia article not found: ${title}`);
        return null;
      }
      throw error;
    }
  }

  private formatTopicName(slug: string): string {
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

export default NCERTAdapter;
