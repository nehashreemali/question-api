#!/usr/bin/env bun

import { existsSync, mkdirSync, statSync, readdirSync } from "fs";
import { spawnSync } from "child_process";

// Curated image URLs for each subcategory
// Format: "category-subcategory": "image_url"
// Using Wikimedia Commons images (free, stable)
const SUBCATEGORY_IMAGES: Record<string, string> = {
  // American Sports
  "american-sports-college": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Rose_Bowl%2C_panorama.jpg/640px-Rose_Bowl%2C_panorama.jpg",
  "american-sports-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Babe_Ruth2.jpg/440px-Babe_Ruth2.jpg",
  "american-sports-legends": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Michael_Jordan_in_2014.jpg/440px-Michael_Jordan_in_2014.jpg",
  "american-sports-mlb": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Major_League_Baseball_logo.svg/640px-Major_League_Baseball_logo.svg.png",
  "american-sports-nba": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Giannis_Antetokounmpo_%2851849872498%29_%28cropped%29.jpg/440px-Giannis_Antetokounmpo_%2851849872498%29_%28cropped%29.jpg",
  "american-sports-nfl": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/American_Football_1.jpg/640px-American_Football_1.jpg",
  "american-sports-nhl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Ice_hockey_McGill_University_1884.jpg/640px-Ice_hockey_McGill_University_1884.jpg",
  "american-sports-records": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Football_Pallo_valridge.jpg/640px-Football_Pallo_valridge.jpg",
  "american-sports-super-bowl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Vince_Lombardi_Trophy.jpg/440px-Vince_Lombardi_Trophy.jpg",
  "american-sports-teams": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Yankee_Stadium_aerial_from_Blackhawk.jpg/640px-Yankee_Stadium_aerial_from_Blackhawk.jpg",

  // Animals
  "animals-animal-behavior": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Meerkat_%28Suricata_suricatta%29_Tswalu.jpg/640px-Meerkat_%28Suricata_suricatta%29_Tswalu.jpg",
  "animals-birds": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Eopsaltria_australis_-_Mogo_Campground.jpg/640px-Eopsaltria_australis_-_Mogo_Campground.jpg",
  "animals-endangered": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GiantPandaEatingBamboo.jpg/640px-GiantPandaEatingBamboo.jpg",
  "animals-fish": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Georgia_Aquarium_-_Giant_Grouper_edit.jpg/640px-Georgia_Aquarium_-_Giant_Grouper_edit.jpg",
  "animals-habitats": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/African_savanna_elephant.jpg/640px-African_savanna_elephant.jpg",
  "animals-insects": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Tagpfauenauge_vanridge.jpg/640px-Tagpfauenauge_vanridge.jpg",
  "animals-mammals": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24_Falkland_Island_Fur_Seals_colony.jpg/640px-24_Falkland_Island_Fur_Seals_colony.jpg",
  "animals-marine-life": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bottlenose_Dolphin_KSC04pd0178.jpg/640px-Bottlenose_Dolphin_KSC04pd0178.jpg",
  "animals-pets": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/640px-YellowLabradorLooking_new.jpg",
  "animals-prehistoric": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Tyrannosaurus_Rex_Holotype.jpg/640px-Tyrannosaurus_Rex_Holotype.jpg",
  "animals-reptiles": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/American_Alligator.jpg/640px-American_Alligator.jpg",
  "animals-wildlife": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/640px-Lion_waiting_in_Namibia.jpg",

  // Anime & Manga
  "anime-manga-anime-creators": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Hayao_Miyazaki.jpg/440px-Hayao_Miyazaki.jpg",
  "anime-manga-classic-anime": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Tezuka_Osamu_manga_museum.jpg/640px-Tezuka_Osamu_manga_museum.jpg",
  "anime-manga-isekai": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Akihabara_2020.jpg/640px-Akihabara_2020.jpg",
  "anime-manga-manga": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Manga_at_Tokyo_store.jpg/640px-Manga_at_Tokyo_store.jpg",
  "anime-manga-mecha": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/RX-78-2_ver._GFT.jpg/440px-RX-78-2_ver._GFT.jpg",
  "anime-manga-seinen": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Akihabara_2020.jpg/640px-Akihabara_2020.jpg",
  "anime-manga-shojo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Nakayosi_Magazine.jpg/440px-Nakayosi_Magazine.jpg",
  "anime-manga-shonen": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Weekly_Shonen_Jump_Logo.svg/640px-Weekly_Shonen_Jump_Logo.svg.png",
  "anime-manga-slice-of-life": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Kyoto_Animation_head_office.jpg/640px-Kyoto_Animation_head_office.jpg",
  "anime-manga-studio-ghibli": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Ghibli_Museum%2C_Mitaka.jpg/640px-Ghibli_Museum%2C_Mitaka.jpg",

  // Art
  "art-architecture": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/440px-Empire_State_Building_%28aerial_view%29.jpg",
  "art-art-movements": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/640px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
  "art-artists": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%28454045%29.jpg/440px-Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_%28454045%29.jpg",
  "art-digital-art": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Wacom_graphics_tablet_and_pen.jpg/640px-Wacom_graphics_tablet_and_pen.jpg",
  "art-modern-art": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Museo_del_Novecento_%28Milano%29.jpg/640px-Museo_del_Novecento_%28Milano%29.jpg",
  "art-museums": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/640px-Louvre_Museum_Wikimedia_Commons.jpg",
  "art-painting": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/440px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg",
  "art-photography": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Photographer_in_Vietnam.jpg/640px-Photographer_in_Vietnam.jpg",
  "art-renaissance": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/The_Creation_of_Adam.jpg/640px-The_Creation_of_Adam.jpg",
  "art-sculpture": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/%27David%27_by_Michelangelo_Fir_JBU002.jpg/440px-%27David%27_by_Michelangelo_Fir_JBU002.jpg",

  // Automobiles
  "automobiles-auto-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/1885Benz.jpg/640px-1885Benz.jpg",
  "automobiles-cars": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/2019_Toyota_Corolla_SE_in_Midnight_Black_Metallic%2C_front_12.12.19.jpg/640px-2019_Toyota_Corolla_SE_in_Midnight_Black_Metallic%2C_front_12.12.19.jpg",
  "automobiles-classic": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/1957_Chevrolet_Bel_Air_2_door_Hardtop.jpg/640px-1957_Chevrolet_Bel_Air_2_door_Hardtop.jpg",
  "automobiles-electric": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/2019_Tesla_Model_3_Performance_AWD%2C_front_8.1.19.jpg/640px-2019_Tesla_Model_3_Performance_AWD%2C_front_8.1.19.jpg",
  "automobiles-manufacturers": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Automobilproduktion.jpg/640px-Automobilproduktion.jpg",
  "automobiles-motorcycles": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Ducati_Panigale_V4_1.jpg/640px-Ducati_Panigale_V4_1.jpg",
  "automobiles-motorsport": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Max_Verstappen_2017_Malaysia_FP2_2.jpg/640px-Max_Verstappen_2017_Malaysia_FP2_2.jpg",
  "automobiles-sports-cars": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Lamborghini_Hurac%C3%A1n_LP_610-4.jpg/640px-Lamborghini_Hurac%C3%A1n_LP_610-4.jpg",
  "automobiles-technology": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Waymo_Chrysler_Pacifica_in_Los_Altos%2C_2017.jpg/640px-Waymo_Chrysler_Pacifica_in_Los_Altos%2C_2017.jpg",
  "automobiles-trucks": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/2019_Ford_F-150_Lariat_SuperCrew%2C_front_10.18.19.jpg/640px-2019_Ford_F-150_Lariat_SuperCrew%2C_front_10.18.19.jpg",

  // Biology
  "biology-anatomy": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Da_Vinci_Vitruve_Luc_Viatour.jpg/440px-Da_Vinci_Vitruve_Luc_Viatour.jpg",
  "biology-cell-biology": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/640px-Animal_cell_structure_en.svg.png",
  "biology-cells": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Animal_cell_structure_en.svg/640px-Animal_cell_structure_en.svg.png",
  "biology-ecology": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Rainforest_Fatu_Hiva.jpg/640px-Rainforest_Fatu_Hiva.jpg",
  "biology-evolution": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ape_skeletons.png/640px-Ape_skeletons.png",
  "biology-genetics": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/440px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
  "biology-human-body": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Da_Vinci_Vitruve_Luc_Viatour.jpg/440px-Da_Vinci_Vitruve_Luc_Viatour.jpg",
  "biology-immunology": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Neutrophil_with_anthrax.jpg/640px-Neutrophil_with_anthrax.jpg",
  "biology-marine-biology": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Coral_reef_at_palmyra.jpg/640px-Coral_reef_at_palmyra.jpg",
  "biology-microbiology": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Salmonella_typhimurium.png/640px-Salmonella_typhimurium.png",
  "biology-molecular-biology": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Protein_structure.png/640px-Protein_structure.png",
  "biology-neuroscience": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/640px-Blausen_0657_MultipolarNeuron.png",

  // Business
  "business-automotive": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Automobilproduktion.jpg/640px-Automobilproduktion.jpg",
  "business-brands": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/640px-Google_2015_logo.svg.png",
  "business-business-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Wall_Street_-_New_York_Stock_Exchange.jpg/640px-Wall_Street_-_New_York_Stock_Exchange.jpg",
  "business-entrepreneurs": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Elon_Musk_Royal_Society.jpg/440px-Elon_Musk_Royal_Society.jpg",
  "business-management": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Business_Meeting.jpg/640px-Business_Meeting.jpg",
  "business-marketing": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Times_Square.jpg/640px-Times_Square.jpg",
  "business-mergers": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Wall_Street_-_New_York_Stock_Exchange.jpg/640px-Wall_Street_-_New_York_Stock_Exchange.jpg",
  "business-retail": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Walmart_store_exterior_5266815680.jpg/640px-Walmart_store_exterior_5266815680.jpg",
  "business-startups": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silicon_Valley_companies.jpg/640px-Silicon_Valley_companies.jpg",
  "business-tech-giants": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Googleplex_-_Pair_of_Androids.jpg/640px-Googleplex_-_Pair_of_Androids.jpg",

  // Chemistry
  "chemistry-analytical": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/UV-Vis_Spectrophotometer.jpg/640px-UV-Vis_Spectrophotometer.jpg",
  "chemistry-biochemistry": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Protein_structure.png/640px-Protein_structure.png",
  "chemistry-elements": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Colour_18-col_PT.svg/640px-Colour_18-col_PT.svg.png",
  "chemistry-environmental": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Sampling_water.jpg/640px-Sampling_water.jpg",
  "chemistry-fundamentals": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Beaker_with_blue_solution.jpg/440px-Beaker_with_blue_solution.jpg",
  "chemistry-inorganic": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Copper_sulfate.jpg/640px-Copper_sulfate.jpg",
  "chemistry-materials": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Single_crystalline_silicon_wafer.jpg/640px-Single_crystalline_silicon_wafer.jpg",
  "chemistry-medicinal": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Pills_MC.jpg/640px-Pills_MC.jpg",
  "chemistry-organic": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Organic_chemistry_laboratory.jpg/640px-Organic_chemistry_laboratory.jpg",
  "chemistry-physical": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Thermodynamics_of_an_ideal_gas.jpg/640px-Thermodynamics_of_an_ideal_gas.jpg",
  "chemistry-reactions": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Combustion_reaction_of_methane.jpg/640px-Combustion_reaction_of_methane.jpg",

  // Combat Sports
  "combat-sports-aew": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Kenny_Omega_2018.jpg/440px-Kenny_Omega_2018.jpg",
  "combat-sports-boxers": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Muhammad_Ali_NYWTS.jpg/440px-Muhammad_Ali_NYWTS.jpg",
  "combat-sports-boxing": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Boxing_Ring.jpg/640px-Boxing_Ring.jpg",
  "combat-sports-championships": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Boxing_Ring.jpg/640px-Boxing_Ring.jpg",
  "combat-sports-classic-wrestling": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Hulk_Hogan_July_2010.jpg/440px-Hulk_Hogan_July_2010.jpg",
  "combat-sports-events": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/WrestleMania_31.jpg/640px-WrestleMania_31.jpg",
  "combat-sports-martial-arts": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Karate_Do.jpg/640px-Karate_Do.jpg",
  "combat-sports-mma": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Khabib_Nurmagomedov_2019.jpg/440px-Khabib_Nurmagomedov_2019.jpg",
  "combat-sports-wrestlers": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/John_Cena_July_2018.jpg/440px-John_Cena_July_2018.jpg",
  "combat-sports-wwe": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/WrestleMania_31.jpg/640px-WrestleMania_31.jpg",

  // Comics
  "comics-comic-creators": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Stan_Lee_by_Gage_Skidmore_3.jpg/440px-Stan_Lee_by_Gage_Skidmore_3.jpg",
  "comics-comic-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Comic_book_collection.jpg/640px-Comic_book_collection.jpg",
  "comics-comic-movies": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Avengers_Age_of_Ultron_cast.jpg/640px-Avengers_Age_of_Ultron_cast.jpg",
  "comics-dc": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Batman_v_Superman_%E2%80%93_Dawn_of_Justice_logo.svg/640px-Batman_v_Superman_%E2%80%93_Dawn_of_Justice_logo.svg.png",
  "comics-graphic-novels": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Comic_book_collection.jpg/640px-Comic_book_collection.jpg",
  "comics-indie": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Comic-Con_2015_%2819439395623%29.jpg/640px-Comic-Con_2015_%2819439395623%29.jpg",
  "comics-marvel": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/MarvelLogo.svg/640px-MarvelLogo.svg.png",
  "comics-superheroes": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Superman_flying.jpg/440px-Superman_flying.jpg",
  "comics-villains": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Joker_%28DC_Comics%29_statue.jpg/440px-Joker_%28DC_Comics%29_statue.jpg",
  "comics-webcomics": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/XKCD_logo.svg/640px-XKCD_logo.svg.png",

  // Cricket
  "cricket-cricket-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Cricket_1882.jpg/640px-Cricket_1882.jpg",
  "cricket-ipl": "https://upload.wikimedia.org/wikipedia/en/thumb/8/84/Indian_Premier_League_Official_Logo.svg/440px-Indian_Premier_League_Official_Logo.svg.png",
  "cricket-odi": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/India_vs_Australia_ODI.jpg/640px-India_vs_Australia_ODI.jpg",
  "cricket-players": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Sachin_Tendulkar_at_MRF_Pace_Foundation.jpg/440px-Sachin_Tendulkar_at_MRF_Pace_Foundation.jpg",
  "cricket-records": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Sachin_Tendulkar_200.jpg/640px-Sachin_Tendulkar_200.jpg",
  "cricket-t20": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/T20_World_Cup_2007.jpg/640px-T20_World_Cup_2007.jpg",
  "cricket-teams": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Team_India_Cricket.jpg/640px-Team_India_Cricket.jpg",
  "cricket-test-cricket": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/The_Ashes_urn.jpg/440px-The_Ashes_urn.jpg",
  "cricket-venues": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Melbourne_Cricket_Ground_panorama.jpg/640px-Melbourne_Cricket_Ground_panorama.jpg",
  "cricket-world-cup": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Imran_Khan_1987.jpg/440px-Imran_Khan_1987.jpg",

  // Economics
  "economics-behavioral": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Ultimatum_game_%28economics%29.svg/640px-Ultimatum_game_%28economics%29.svg.png",
  "economics-cryptocurrency": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/440px-Bitcoin.svg.png",
  "economics-currencies": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/US_and_Euro_currency.jpg/640px-US_and_Euro_currency.jpg",
  "economics-economic-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Great_Depression_unemployment_line.jpg/640px-Great_Depression_unemployment_line.jpg",
  "economics-economic-policies": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Federal_Reserve.jpg/640px-Federal_Reserve.jpg",
  "economics-economists": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Adam_Smith_portrait.jpg/440px-Adam_Smith_portrait.jpg",
  "economics-finance": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Wall_Street_-_New_York_Stock_Exchange.jpg/640px-Wall_Street_-_New_York_Stock_Exchange.jpg",
  "economics-india": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Reserve_Bank_of_India.jpg/640px-Reserve_Bank_of_India.jpg",
  "economics-international-trade": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Container_ship.jpg/640px-Container_ship.jpg",
  "economics-macroeconomics": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/GDP_real_growth_rate_world.jpg/640px-GDP_real_growth_rate_world.jpg",
  "economics-microeconomics": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Supply-demand-equilibrium.svg/640px-Supply-demand-equilibrium.svg.png",
  "economics-stock-market": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Wall_Street_-_New_York_Stock_Exchange.jpg/640px-Wall_Street_-_New_York_Stock_Exchange.jpg",

  // Entertainment
  "entertainment-awards": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Academy_Award_trophy.jpg/440px-Academy_Award_trophy.jpg",
  "entertainment-gaming": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "entertainment-literature": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "entertainment-music": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_concert_at_Wembley_Stadium.jpg/640px-A_concert_at_Wembley_Stadium.jpg",

  // Environment
  "environment-biodiversity": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Coral_reef_at_palmyra.jpg/640px-Coral_reef_at_palmyra.jpg",
  "environment-climate": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Glacial_landscape.jpg/640px-Glacial_landscape.jpg",
  "environment-climate-change": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Iceberg_with_hole.jpg/640px-Iceberg_with_hole.jpg",
  "environment-conservation": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Yellowstone_National_Park.jpg/640px-Yellowstone_National_Park.jpg",
  "environment-ecosystems": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Rainforest_Fatu_Hiva.jpg/640px-Rainforest_Fatu_Hiva.jpg",
  "environment-geology": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Grand_Canyon_view_from_Pima_Point_2010.jpg/640px-Grand_Canyon_view_from_Pima_Point_2010.jpg",
  "environment-natural-disasters": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Hurricane_Katrina_August_28_2005.jpg/640px-Hurricane_Katrina_August_28_2005.jpg",
  "environment-oceans": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Clouds_over_the_Atlantic_Ocean.jpg/640px-Clouds_over_the_Atlantic_Ocean.jpg",
  "environment-pollution": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Beijing_smog_comparison_August_2005.png/640px-Beijing_smog_comparison_August_2005.png",
  "environment-recycling": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Recycling_symbol.svg/440px-Recycling_symbol.svg.png",
  "environment-renewable-energy": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Wind_power_plants_in_Xinjiang%2C_China.jpg/640px-Wind_power_plants_in_Xinjiang%2C_China.jpg",
  "environment-sustainability": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Sustainable_development.svg/640px-Sustainable_development.svg.png",
  "environment-weather": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Thunderstorm_approaching.jpg/640px-Thunderstorm_approaching.jpg",

  // Epics
  "epics-aeneid": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/The_Flight_from_Troy.jpg/640px-The_Flight_from_Troy.jpg",
  "epics-beowulf": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Beowulf_Cotton_MS_Vitellius_A_XV_f._132r.jpg/440px-Beowulf_Cotton_MS_Vitellius_A_XV_f._132r.jpg",
  "epics-bhagavad-gita": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Bhagavad_Gita%2C_19th_century.jpg/440px-Bhagavad_Gita%2C_19th_century.jpg",
  "epics-divine-comedy": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Dante_and_Beatrice.jpg/440px-Dante_and_Beatrice.jpg",
  "epics-iliad": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Achilles_Patroklos_Antikensammlung_Berlin_F2278.jpg/440px-Achilles_Patroklos_Antikensammlung_Berlin_F2278.jpg",
  "epics-indian": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/A_page_from_Mahabharata.jpg/440px-A_page_from_Mahabharata.jpg",
  "epics-mahabharata": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Kurukshetra.jpg/640px-Kurukshetra.jpg",
  "epics-odyssey": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Odysseus_And_The_Sirens.jpg/640px-Odysseus_And_The_Sirens.jpg",
  "epics-paradise-lost": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Paradise_Lost_1.jpg/440px-Paradise_Lost_1.jpg",
  "epics-puranas": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Vishnu_Matsya.jpg/440px-Vishnu_Matsya.jpg",
  "epics-ramayana": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Rama_and_Hanuman.jpg/440px-Rama_and_Hanuman.jpg",

  // Famous People
  "famous-people-achievements": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Academy_Award_trophy.jpg/440px-Academy_Award_trophy.jpg",
  "famous-people-activists": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Luther_King%2C_Jr..jpg/440px-Martin_Luther_King%2C_Jr..jpg",
  "famous-people-actors": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Tom_Hanks_TIFF_2019.jpg/440px-Tom_Hanks_TIFF_2019.jpg",
  "famous-people-artists": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Frida_Kahlo%2C_by_Guillermo_Kahlo.jpg/440px-Frida_Kahlo%2C_by_Guillermo_Kahlo.jpg",
  "famous-people-athletes": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Usain_Bolt_Berlin_2009.jpg/440px-Usain_Bolt_Berlin_2009.jpg",
  "famous-people-entrepreneurs": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Steve_Jobs_Headshot_2010.jpg/440px-Steve_Jobs_Headshot_2010.jpg",
  "famous-people-inventors": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Thomas_Edison2.jpg/440px-Thomas_Edison2.jpg",
  "famous-people-leaders": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sir_Winston_Churchill.jpg/440px-Sir_Winston_Churchill.jpg",
  "famous-people-musicians": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Elvis_Presley_promoting_Jailhouse_Rock.jpg/440px-Elvis_Presley_promoting_Jailhouse_Rock.jpg",
  "famous-people-scientists": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/440px-Albert_Einstein_Head.jpg",
  "famous-people-writers": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/William_Shakespeare_1609.jpg/440px-William_Shakespeare_1609.jpg",

  // Food
  "food-beverages": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/640px-A_small_cup_of_coffee.JPG",
  "food-cooking": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Chef_at_work.jpg/640px-Chef_at_work.jpg",
  "food-cuisines": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
  "food-desserts": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Cake_mix.jpg/640px-Cake_mix.jpg",
  "food-dietary": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
  "food-famous-chefs": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Gordon_Ramsay.jpg/440px-Gordon_Ramsay.jpg",
  "food-food-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Pieter_Claesz_002.jpg/640px-Pieter_Claesz_002.jpg",
  "food-ingredients": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Spices_in_a_spice_market.jpg/640px-Spices_in_a_spice_market.jpg",
  "food-restaurants": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Restaurant_tables.jpg/640px-Restaurant_tables.jpg",
  "food-street-food": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Street_food_vendor.jpg/640px-Street_food_vendor.jpg",
  "food-world-cuisines": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Sushi_platter.jpg/640px-Sushi_platter.jpg",

  // Football (Soccer)
  "football-champions-league": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/UEFA_Champions_League_logo_2.svg/440px-UEFA_Champions_League_logo_2.svg.png",
  "football-clubs": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Camp_Nou_aerial.jpg/640px-Camp_Nou_aerial.jpg",
  "football-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/1930_world_cup.jpg/640px-1930_world_cup.jpg",
  "football-la-liga": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Camp_Nou_aerial.jpg/640px-Camp_Nou_aerial.jpg",
  "football-managers": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Alex_Ferguson.jpg/440px-Alex_Ferguson.jpg",
  "football-players": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Lionel_Messi_2017.jpg/440px-Lionel_Messi_2017.jpg",
  "football-premier-league": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Premier_League_Logo.svg/640px-Premier_League_Logo.svg.png",
  "football-tactics": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Soccer_Field_-_Football_Field.svg/640px-Soccer_Field_-_Football_Field.svg.png",
  "football-transfers": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Lionel_Messi_2017.jpg/440px-Lionel_Messi_2017.jpg",
  "football-world-cup": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/FIFA_World_Cup_Trophy_2018.jpg/440px-FIFA_World_Cup_Trophy_2018.jpg",

  // General Knowledge
  "general-knowledge-current-affairs": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Newspaper_on_table.jpg/640px-Newspaper_on_table.jpg",
  "general-knowledge-india": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/India_Gate_in_New_Delhi_03-2016.jpg/640px-India_Gate_in_New_Delhi_03-2016.jpg",
  "general-knowledge-indian-epics": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Kurukshetra.jpg/640px-Kurukshetra.jpg",
  "general-knowledge-miscellaneous": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/640px-Cat03.jpg",

  // Geography
  "geography-capitals": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Giza_Pyramids.jpg/640px-All_Giza_Pyramids.jpg",
  "geography-continents": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Continents_colour2.png/640px-Continents_colour2.png",
  "geography-countries": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/World_map_with_countries.svg/640px-World_map_with_countries.svg.png",
  "geography-deserts": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Rub_al_Khali_002.JPG/640px-Rub_al_Khali_002.JPG",
  "geography-human": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Population_density.png/640px-Population_density.png",
  "geography-india": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/India_map_en.png/440px-India_map_en.png",
  "geography-islands": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Bora_Bora_ISS006.jpg/640px-Bora_Bora_ISS006.jpg",
  "geography-landmarks": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
  "geography-mountains": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Everest_North_Face.jpg/640px-Everest_North_Face.jpg",
  "geography-oceans-seas": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Clouds_over_the_Atlantic_Ocean.jpg/640px-Clouds_over_the_Atlantic_Ocean.jpg",
  "geography-physical": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/World_map_physical.jpg/640px-World_map_physical.jpg",
  "geography-political": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/World_map_with_countries.svg/640px-World_map_with_countries.svg.png",
  "geography-rivers-lakes": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Amazon_river.jpg/640px-Amazon_river.jpg",

  // Health
  "health-anatomy": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Human_skeleton_front.svg/440px-Human_skeleton_front.svg.png",
  "health-diseases": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Coronavirus_SARS-CoV-2.jpg/640px-Coronavirus_SARS-CoV-2.jpg",
  "health-famous-doctors": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Florence_Nightingale.jpg/440px-Florence_Nightingale.jpg",
  "health-first-aid": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/First_aid_kit.jpg/640px-First_aid_kit.jpg",
  "health-medical-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Florence_Nightingale.jpg/440px-Florence_Nightingale.jpg",
  "health-mental-health": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/640px-Blausen_0657_MultipolarNeuron.png",
  "health-nutrition": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
  "health-pharmaceuticals": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Pills_MC.jpg/640px-Pills_MC.jpg",
  "health-public-health": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Hospital.jpg/640px-Hospital.jpg",
  "health-treatments": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Surgery_theater.jpg/640px-Surgery_theater.jpg",

  // History
  "history-ancient": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Giza_Pyramids.jpg/640px-All_Giza_Pyramids.jpg",
  "history-civilizations": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Colosseum_in_Rome%2C_Italy.jpg/640px-Colosseum_in_Rome%2C_Italy.jpg",
  "history-cold-war": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Berlin_Wall_1961.jpg/640px-Berlin_Wall_1961.jpg",
  "history-colonialism": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/British_Empire_1921.png/640px-British_Empire_1921.png",
  "history-contemporary": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/September_11_Photo_Montage.jpg/440px-September_11_Photo_Montage.jpg",
  "history-medieval": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Castillo_de_Loarre.jpg/640px-Castillo_de_Loarre.jpg",
  "history-modern": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Industrial_revolution.jpg/640px-Industrial_revolution.jpg",
  "history-regional": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/World_map_with_countries.svg/640px-World_map_with_countries.svg.png",
  "history-renaissance": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Florence_Cathedral.jpg/640px-Florence_Cathedral.jpg",
  "history-revolutions": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg/640px-Eug%C3%A8ne_Delacroix_-_La_libert%C3%A9_guidant_le_peuple.jpg",
  "history-world-wars": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/D-Day_landing.jpg/640px-D-Day_landing.jpg",

  // Inventions
  "inventions-ancient": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Wheel_on_ancient_Greek_chariot.jpg/640px-Wheel_on_ancient_Greek_chariot.jpg",
  "inventions-communication": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Alexander_Graham_Bell.jpg/440px-Alexander_Graham_Bell.jpg",
  "inventions-digital": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Apple_Computer_1.jpg/640px-Apple_Computer_1.jpg",
  "inventions-energy": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lightbulb.jpg/440px-Lightbulb.jpg",
  "inventions-everyday": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lightbulb.jpg/440px-Lightbulb.jpg",
  "inventions-industrial": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Industrial_revolution.jpg/640px-Industrial_revolution.jpg",
  "inventions-medical": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/X-ray_by_Wilhelm_R%C3%B6ntgen.jpg/440px-X-ray_by_Wilhelm_R%C3%B6ntgen.jpg",
  "inventions-modern": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "inventions-scientific": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Teleskop.jpg/440px-Teleskop.jpg",
  "inventions-transportation": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Wright_Flyer.jpg/640px-Wright_Flyer.jpg",

  // Languages
  "languages-ancient": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Rosetta_Stone.JPG/440px-Rosetta_Stone.JPG",
  "languages-arabic": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Arabic_calligraphy.jpg/640px-Arabic_calligraphy.jpg",
  "languages-asian": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Chinese_characters.svg/440px-Chinese_characters.svg.png",
  "languages-english": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/English_language.svg/640px-English_language.svg.png",
  "languages-etymology": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "languages-french": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/640px-Flag_of_France.svg.png",
  "languages-german": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Flag_of_Germany.svg/640px-Flag_of_Germany.svg.png",
  "languages-indian": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Devanagari_script.svg/640px-Devanagari_script.svg.png",
  "languages-linguistics": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "languages-spanish": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/640px-Flag_of_Spain.svg.png",
  "languages-world-languages": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/World_map_with_countries.svg/640px-World_map_with_countries.svg.png",

  // Literature
  "literature-authors": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/William_Shakespeare_1609.jpg/440px-William_Shakespeare_1609.jpg",
  "literature-awards": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Nobel_Prize.png/440px-Nobel_Prize.png",
  "literature-childrens": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Alice_in_Wonderland.jpg/440px-Alice_in_Wonderland.jpg",
  "literature-classics": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "literature-fantasy-scifi": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/JRR_Tolkien.jpg/440px-JRR_Tolkien.jpg",
  "literature-fiction": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "literature-literary-movements": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "literature-modern-literature": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "literature-mystery": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Agatha_Christie.jpg/440px-Agatha_Christie.jpg",
  "literature-non-fiction": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",
  "literature-poetry": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Robert_Frost.jpg/440px-Robert_Frost.jpg",
  "literature-quotes": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_on_a_shelf.jpg/640px-Books_on_a_shelf.jpg",

  // Mathematics
  "mathematics-advanced": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Navier_stokes_equation.svg/640px-Navier_stokes_equation.svg.png",
  "mathematics-algebra": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Quadratic_equation.svg/640px-Quadratic_equation.svg.png",
  "mathematics-applied": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Linear_regression.svg/640px-Linear_regression.svg.png",
  "mathematics-applied-math": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Linear_regression.svg/640px-Linear_regression.svg.png",
  "mathematics-calculus": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Integral_example.svg/440px-Integral_example.svg.png",
  "mathematics-discrete-math": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/6n-graf.svg/440px-6n-graf.svg.png",
  "mathematics-fundamentals": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Math_class.jpg/640px-Math_class.jpg",
  "mathematics-geometry": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Euclid%27s_Elements.jpg/440px-Euclid%27s_Elements.jpg",
  "mathematics-linear-algebra": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Linear_subspaces.svg/640px-Linear_subspaces.svg.png",
  "mathematics-logic": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Venn_diagram_gr_la_ru.svg/640px-Venn_diagram_gr_la_ru.svg.png",
  "mathematics-number-theory": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Ulam_spiral.svg/640px-Ulam_spiral.svg.png",
  "mathematics-statistics": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Normal_distribution.svg/640px-Normal_distribution.svg.png",
  "mathematics-trigonometry": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Circle-trig6.svg/640px-Circle-trig6.svg.png",

  // Military
  "military-air-warfare": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/F-22_Raptor.jpg/640px-F-22_Raptor.jpg",
  "military-ancient-warfare": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Greek_Phalanx.jpg/640px-Greek_Phalanx.jpg",
  "military-famous-battles": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/D-Day_landing.jpg/640px-D-Day_landing.jpg",
  "military-medieval-warfare": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Medieval_knight.jpg/440px-Medieval_knight.jpg",
  "military-military-leaders": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Napoleon_crossing_the_Alps.jpg/440px-Napoleon_crossing_the_Alps.jpg",
  "military-modern-conflicts": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/M1A1_Abrams.jpg/640px-M1A1_Abrams.jpg",
  "military-naval-warfare": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/USS_Missouri.jpg/640px-USS_Missouri.jpg",
  "military-weapons": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/AK-47.jpg/640px-AK-47.jpg",
  "military-world-war-1": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/WWI_trench.jpg/640px-WWI_trench.jpg",
  "military-world-war-2": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/D-Day_landing.jpg/640px-D-Day_landing.jpg",

  // Movies
  "movies-action": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Action_movie_explosion.jpg/640px-Action_movie_explosion.jpg",
  "movies-animated": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Walt_Disney_1946.jpg/440px-Walt_Disney_1946.jpg",
  "movies-awards": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Academy_Award_trophy.jpg/440px-Academy_Award_trophy.jpg",
  "movies-classics": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Charlie_Chaplin.jpg/440px-Charlie_Chaplin.jpg",
  "movies-comedy": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Charlie_Chaplin.jpg/440px-Charlie_Chaplin.jpg",
  "movies-directors": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Alfred_Hitchcock.jpg/440px-Alfred_Hitchcock.jpg",
  "movies-drama": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Casablanca_film.jpg/640px-Casablanca_film.jpg",
  "movies-fantasy": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Ghibli_Museum%2C_Mitaka.jpg/640px-Ghibli_Museum%2C_Mitaka.jpg",
  "movies-franchises": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/640px-Star_Wars_Logo.svg.png",
  "movies-genres": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Film_strip.jpg/440px-Film_strip.jpg",
  "movies-horror": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Alfred_Hitchcock.jpg/440px-Alfred_Hitchcock.jpg",
  "movies-sci-fi": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/640px-Star_Wars_Logo.svg.png",
  "movies-studios": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Hollywood_Sign.jpg/640px-Hollywood_Sign.jpg",

  // Music
  "music-artists": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Beatles_ad_1965.jpg/440px-Beatles_ad_1965.jpg",
  "music-awards": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Grammy_Award.jpg/440px-Grammy_Award.jpg",
  "music-bollywood": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Bollywood_poster.jpg/440px-Bollywood_poster.jpg",
  "music-charts": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_concert_at_Wembley_Stadium.jpg/640px-A_concert_at_Wembley_Stadium.jpg",
  "music-classical": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ludwig_van_Beethoven.jpg/440px-Ludwig_van_Beethoven.jpg",
  "music-country": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Guitar_1.jpg/440px-Guitar_1.jpg",
  "music-electronic": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/DJ_Turntable.jpg/640px-DJ_Turntable.jpg",
  "music-hip-hop": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Boombox.jpg/640px-Boombox.jpg",
  "music-instruments": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Grand_piano.jpg/640px-Grand_piano.jpg",
  "music-jazz": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Louis_Armstrong.jpg/440px-Louis_Armstrong.jpg",
  "music-music-theory": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Music_notes.svg/640px-Music_notes.svg.png",
  "music-pop": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Michael_Jackson.jpg/440px-Michael_Jackson.jpg",
  "music-rock": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Queen_performing.jpg/640px-Queen_performing.jpg",
  "music-world-music": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/African_drums.jpg/640px-African_drums.jpg",

  // Mythology
  "mythology-african": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/African_mask.jpg/440px-African_mask.jpg",
  "mythology-celtic": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Celtic_cross.jpg/440px-Celtic_cross.jpg",
  "mythology-chinese": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Chinese_dragon.jpg/640px-Chinese_dragon.jpg",
  "mythology-egyptian": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Egypt_gods.jpg/640px-Egypt_gods.jpg",
  "mythology-greek": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Athena_Parthenos.jpg/440px-Athena_Parthenos.jpg",
  "mythology-hindu": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Shiva_Nataraja.jpg/440px-Shiva_Nataraja.jpg",
  "mythology-japanese": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Torii_gate.jpg/640px-Torii_gate.jpg",
  "mythology-native-american": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Totem_pole.jpg/440px-Totem_pole.jpg",
  "mythology-norse": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Thor%27s_hammer.jpg/440px-Thor%27s_hammer.jpg",
  "mythology-roman": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Jupiter_statue.jpg/440px-Jupiter_statue.jpg",
  "mythology-world-mythology": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Shiva_Nataraja.jpg/440px-Shiva_Nataraja.jpg",

  // Olympics
  "olympics-gymnastics": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Simone_Biles.jpg/440px-Simone_Biles.jpg",
  "olympics-host-cities": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Olympic_Stadium_Tokyo.jpg/640px-Olympic_Stadium_Tokyo.jpg",
  "olympics-olympians": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Usain_Bolt_Berlin_2009.jpg/440px-Usain_Bolt_Berlin_2009.jpg",
  "olympics-paralympics": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Paralympic_Games_logo.svg/440px-Paralympic_Games_logo.svg.png",
  "olympics-records": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Usain_Bolt_Berlin_2009.jpg/440px-Usain_Bolt_Berlin_2009.jpg",
  "olympics-sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Olympic_rings.svg/640px-Olympic_rings.svg.png",
  "olympics-summer-olympics": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Olympic_rings.svg/640px-Olympic_rings.svg.png",
  "olympics-swimming": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Michael_Phelps.jpg/440px-Michael_Phelps.jpg",
  "olympics-track-field": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Usain_Bolt_Berlin_2009.jpg/440px-Usain_Bolt_Berlin_2009.jpg",
  "olympics-winter-olympics": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Ski_jump.jpg/640px-Ski_jump.jpg",

  // Other Sports
  "other-sports-badminton": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Badminton_racket.jpg/440px-Badminton_racket.jpg",
  "other-sports-cycling": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Tour_de_France.jpg/640px-Tour_de_France.jpg",
  "other-sports-esports": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Esports_event.jpg/640px-Esports_event.jpg",
  "other-sports-extreme": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Surfing.jpg/640px-Surfing.jpg",
  "other-sports-golf": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Golf_swing.jpg/640px-Golf_swing.jpg",
  "other-sports-horse-racing": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Horse_racing.jpg/640px-Horse_racing.jpg",
  "other-sports-motorsport": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Max_Verstappen_2017_Malaysia_FP2_2.jpg/640px-Max_Verstappen_2017_Malaysia_FP2_2.jpg",
  "other-sports-rugby": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Rugby_ball.jpg/640px-Rugby_ball.jpg",
  "other-sports-skiing": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Ski_jump.jpg/640px-Ski_jump.jpg",
  "other-sports-tennis": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Roger_Federer.jpg/440px-Roger_Federer.jpg",

  // Philosophy
  "philosophy-eastern": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Buddha_statue.jpg/440px-Buddha_statue.jpg",
  "philosophy-epistemology": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Socrates_Louvre.jpg/440px-Socrates_Louvre.jpg",
  "philosophy-ethics": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Socrates_Louvre.jpg/440px-Socrates_Louvre.jpg",
  "philosophy-existentialism": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Jean-Paul_Sartre.jpg/440px-Jean-Paul_Sartre.jpg",
  "philosophy-logic": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Aristotle.jpg/440px-Aristotle.jpg",
  "philosophy-metaphysics": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Plato_Silanion.jpg/440px-Plato_Silanion.jpg",
  "philosophy-modern": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Immanuel_Kant.jpg/440px-Immanuel_Kant.jpg",
  "philosophy-philosophers": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Plato_Silanion.jpg/440px-Plato_Silanion.jpg",
  "philosophy-political": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/John_Locke.jpg/440px-John_Locke.jpg",
  "philosophy-western": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Socrates_Louvre.jpg/440px-Socrates_Louvre.jpg",

  // Physics
  "physics-acoustics": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Sound_wave.svg/640px-Sound_wave.svg.png",
  "physics-astrophysics": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414.jpg/640px-NGC_4414.jpg",
  "physics-electromagnetism": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Electromagnetism.svg/440px-Electromagnetism.svg.png",
  "physics-mechanics": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Newton%27s_cradle.jpg/640px-Newton%27s_cradle.jpg",
  "physics-nuclear": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Atom_symbol.svg/440px-Atom_symbol.svg.png",
  "physics-nuclear-physics": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Atom_symbol.svg/440px-Atom_symbol.svg.png",
  "physics-optics": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Prism_rainbow.jpg/640px-Prism_rainbow.jpg",
  "physics-particle-physics": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Standard_Model_of_Elementary_Particles.svg/640px-Standard_Model_of_Elementary_Particles.svg.png",
  "physics-quantum": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Schrodingers_cat.svg/640px-Schrodingers_cat.svg.png",
  "physics-quantum-physics": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Schrodingers_cat.svg/640px-Schrodingers_cat.svg.png",
  "physics-relativity": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/440px-Albert_Einstein_Head.jpg",
  "physics-thermodynamics": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Steam_engine.jpg/640px-Steam_engine.jpg",
  "physics-waves": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Sound_wave.svg/640px-Sound_wave.svg.png",

  // Plants
  "plants-aquatic": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Water_lily.jpg/640px-Water_lily.jpg",
  "plants-botany": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Flower_diagram.svg/440px-Flower_diagram.svg.png",
  "plants-crops": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Wheat_field.jpg/640px-Wheat_field.jpg",
  "plants-ecosystems": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Rainforest_Fatu_Hiva.jpg/640px-Rainforest_Fatu_Hiva.jpg",
  "plants-edible-plants": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/640px-Good_Food_Display_-_NCI_Visuals_Online.jpg",
  "plants-flowers": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Sunflower_from_Silesia.jpg/640px-Sunflower_from_Silesia.jpg",
  "plants-fungi": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Amanita_muscaria.jpg/440px-Amanita_muscaria.jpg",
  "plants-gardening": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Garden.jpg/640px-Garden.jpg",
  "plants-medicinal": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Aloe_vera.jpg/440px-Aloe_vera.jpg",
  "plants-plant-biology": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Leaf_cross_section.svg/640px-Leaf_cross_section.svg.png",
  "plants-trees": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Ash_Tree.jpg/640px-Ash_Tree.jpg",

  // Politics
  "politics-constitutions": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/US_Constitution.jpg/440px-US_Constitution.jpg",
  "politics-elections": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Ballot_box.jpg/440px-Ballot_box.jpg",
  "politics-india": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Parliament_of_India.jpg/640px-Parliament_of_India.jpg",
  "politics-international": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/United_Nations_HQ.jpg/640px-United_Nations_HQ.jpg",
  "politics-laws": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Lady_Justice.jpg/440px-Lady_Justice.jpg",
  "politics-leaders": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/440px-President_Barack_Obama.jpg",
  "politics-movements": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Martin_Luther_King%2C_Jr..jpg/440px-Martin_Luther_King%2C_Jr..jpg",
  "politics-political-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sir_Winston_Churchill.jpg/440px-Sir_Winston_Churchill.jpg",
  "politics-political-parties": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Ballot_box.jpg/440px-Ballot_box.jpg",
  "politics-political-systems": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/US_Constitution.jpg/440px-US_Constitution.jpg",
  "politics-un": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/United_Nations_HQ.jpg/640px-United_Nations_HQ.jpg",
  "politics-world-leaders": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sir_Winston_Churchill.jpg/440px-Sir_Winston_Churchill.jpg",

  // Programming
  "programming-algorithms": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Binary_search_tree.svg/440px-Binary_search_tree.svg.png",
  "programming-cpp": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/ISO_C%2B%2B_Logo.svg/440px-ISO_C%2B%2B_Logo.svg.png",
  "programming-databases": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Postgresql_elephant.svg/440px-Postgresql_elephant.svg.png",
  "programming-devops": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Docker_%28container_engine%29_logo.svg/640px-Docker_%28container_engine%29_logo.svg.png",
  "programming-java": "https://upload.wikimedia.org/wikipedia/en/thumb/3/30/Java_programming_language_logo.svg/440px-Java_programming_language_logo.svg.png",
  "programming-javascript": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Unofficial_JavaScript_logo_2.svg/440px-Unofficial_JavaScript_logo_2.svg.png",
  "programming-mobile-dev": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/440px-React-icon.svg.png",
  "programming-open-source": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Opensource.svg/440px-Opensource.svg.png",
  "programming-python": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/440px-Python-logo-notext.svg.png",
  "programming-web-dev": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/HTML5_logo_and_wordmark.svg/440px-HTML5_logo_and_wordmark.svg.png",

  // Psychology
  "psychology-behavioral": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/B.F._Skinner.jpg/440px-B.F._Skinner.jpg",
  "psychology-clinical": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Sigmund_Freud.jpg/440px-Sigmund_Freud.jpg",
  "psychology-cognitive": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/640px-Blausen_0657_MultipolarNeuron.png",
  "psychology-developmental": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Jean_Piaget.jpg/440px-Jean_Piaget.jpg",
  "psychology-disorders": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/640px-Blausen_0657_MultipolarNeuron.png",
  "psychology-neuroscience": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Blausen_0657_MultipolarNeuron.png/640px-Blausen_0657_MultipolarNeuron.png",
  "psychology-personality": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Carl_Jung.jpg/440px-Carl_Jung.jpg",
  "psychology-psychologists": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Sigmund_Freud.jpg/440px-Sigmund_Freud.jpg",
  "psychology-social": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Business_Meeting.jpg/640px-Business_Meeting.jpg",
  "psychology-therapies": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Sigmund_Freud.jpg/440px-Sigmund_Freud.jpg",

  // Regional History
  "regional-history-african": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Giza_Pyramids.jpg/640px-All_Giza_Pyramids.jpg",
  "regional-history-american": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/US_Capitol.jpg/640px-US_Capitol.jpg",
  "regional-history-asian": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Great_Wall_of_China.jpg/640px-Great_Wall_of_China.jpg",
  "regional-history-british": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Palace_of_Westminster.jpg/640px-Palace_of_Westminster.jpg",
  "regional-history-chinese": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Great_Wall_of_China.jpg/640px-Great_Wall_of_China.jpg",
  "regional-history-european": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Colosseum_in_Rome%2C_Italy.jpg/640px-Colosseum_in_Rome%2C_Italy.jpg",
  "regional-history-india": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
  "regional-history-indian": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
  "regional-history-latin-american": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu.jpg/640px-Machu_Picchu.jpg",
  "regional-history-middle-eastern": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Petra_Treasury.jpg/440px-Petra_Treasury.jpg",
  "regional-history-russian": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Saint_Basil%27s_Cathedral.jpg/440px-Saint_Basil%27s_Cathedral.jpg",

  // Religion
  "religion-ancient-religions": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Egypt_gods.jpg/640px-Egypt_gods.jpg",
  "religion-buddhism": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Buddha_statue.jpg/440px-Buddha_statue.jpg",
  "religion-christianity": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/St_Peter%27s_Basilica.jpg/640px-St_Peter%27s_Basilica.jpg",
  "religion-comparative": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Religious_symbols.svg/640px-Religious_symbols.svg.png",
  "religion-hinduism": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Shiva_Nataraja.jpg/440px-Shiva_Nataraja.jpg",
  "religion-islam": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Masjid_al-Haram.jpg/640px-Masjid_al-Haram.jpg",
  "religion-jainism": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Jain_symbol.svg/440px-Jain_symbol.svg.png",
  "religion-judaism": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Star_of_David.svg/440px-Star_of_David.svg.png",
  "religion-sikhism": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Golden_Temple.jpg/640px-Golden_Temple.jpg",
  "religion-taoism": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Yin_yang.svg/440px-Yin_yang.svg.png",
  "religion-world-religions": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Religious_symbols.svg/640px-Religious_symbols.svg.png",

  // Science
  "science-astronomy": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414.jpg/640px-NGC_4414.jpg",
  "science-biology": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/DNA_Structure%2BKey%2BLabelled.pn_NoBB.png/440px-DNA_Structure%2BKey%2BLabelled.pn_NoBB.png",
  "science-chemistry": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Colour_18-col_PT.svg/640px-Colour_18-col_PT.svg.png",
  "science-earth-science": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Grand_Canyon_view_from_Pima_Point_2010.jpg/640px-Grand_Canyon_view_from_Pima_Point_2010.jpg",
  "science-physics": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Atom_symbol.svg/440px-Atom_symbol.svg.png",

  // Space
  "space-astrobiology": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Mars_Curiosity_Rover.jpg/640px-Mars_Curiosity_Rover.jpg",
  "space-astronauts": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Aldrin_Apollo_11.jpg/440px-Aldrin_Apollo_11.jpg",
  "space-astronomy": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414.jpg/640px-NGC_4414.jpg",
  "space-black-holes": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Black_hole_-_Messier_87.jpg/640px-Black_hole_-_Messier_87.jpg",
  "space-exoplanets": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Kepler_186f.jpg/640px-Kepler_186f.jpg",
  "space-exploration": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Aldrin_Apollo_11.jpg/440px-Aldrin_Apollo_11.jpg",
  "space-galaxies": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414.jpg/640px-NGC_4414.jpg",
  "space-planets": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Solar_System.jpg/640px-Solar_System.jpg",
  "space-solar-system": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Solar_System.jpg/640px-Solar_System.jpg",
  "space-space-exploration": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/640px-NASA_logo.svg.png",
  "space-space-technology": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/ISS_and_Endeavour.jpg/640px-ISS_and_Endeavour.jpg",
  "space-stars": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly.jpg/640px-The_Sun_by_the_Atmospheric_Imaging_Assembly.jpg",
  "space-telescopes": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Hubble_01.jpg/440px-Hubble_01.jpg",

  // Sports (generic)
  "sports-american-sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/American_Football_1.jpg/640px-American_Football_1.jpg",
  "sports-combat-sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Boxing_Ring.jpg/640px-Boxing_Ring.jpg",
  "sports-cricket": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Melbourne_Cricket_Ground_panorama.jpg/640px-Melbourne_Cricket_Ground_panorama.jpg",
  "sports-football": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Football_%28soccer_ball%29.svg/440px-Football_%28soccer_ball%29.svg.png",
  "sports-motorsport": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Max_Verstappen_2017_Malaysia_FP2_2.jpg/640px-Max_Verstappen_2017_Malaysia_FP2_2.jpg",
  "sports-olympics": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Olympic_rings.svg/640px-Olympic_rings.svg.png",
  "sports-other-sports": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Roger_Federer.jpg/440px-Roger_Federer.jpg",
  "sports-tennis": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Roger_Federer.jpg/440px-Roger_Federer.jpg",

  // Technology
  "technology-ai": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/440px-ChatGPT_logo.svg.png",
  "technology-computers": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Personal_computer%2C_exploded.svg/640px-Personal_computer%2C_exploded.svg.png",
  "technology-computing": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Personal_computer%2C_exploded.svg/640px-Personal_computer%2C_exploded.svg.png",
  "technology-cybersecurity": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Cybersecurity.svg/640px-Cybersecurity.svg.png",
  "technology-innovations": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lightbulb.jpg/440px-Lightbulb.jpg",
  "technology-internet": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Internet_map.jpg/640px-Internet_map.jpg",
  "technology-mobile": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Smartphone.jpg/440px-Smartphone.jpg",
  "technology-robotics": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Boston_Dynamics_Spot.jpg/640px-Boston_Dynamics_Spot.jpg",
  "technology-software": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Source_code.svg/640px-Source_code.svg.png",
  "technology-tech-companies": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/640px-Google_2015_logo.svg.png",
  "technology-tech-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Apple_Computer_1.jpg/640px-Apple_Computer_1.jpg",
  "technology-vr-ar": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/VR_headset.jpg/640px-VR_headset.jpg",

  // Travel
  "travel-adventure": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Surfing.jpg/640px-Surfing.jpg",
  "travel-airlines": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Airplane_takeoff.jpg/640px-Airplane_takeoff.jpg",
  "travel-cruises": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Cruise_ship.jpg/640px-Cruise_ship.jpg",
  "travel-cultural": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
  "travel-destinations": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Giza_Pyramids.jpg/640px-All_Giza_Pyramids.jpg",
  "travel-hotels": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Burj_Al_Arab.jpg/440px-Burj_Al_Arab.jpg",
  "travel-landmarks": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/440px-Tour_Eiffel_Wikimedia_Commons.jpg",
  "travel-national-parks": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Yellowstone_National_Park.jpg/640px-Yellowstone_National_Park.jpg",
  "travel-travel-tips": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Passport_stamps.jpg/640px-Passport_stamps.jpg",
  "travel-wonders": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Giza_Pyramids.jpg/640px-All_Giza_Pyramids.jpg",

  // TV Shows
  "tv-shows-animated": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/The_Simpsons.svg/640px-The_Simpsons.svg.png",
  "tv-shows-awards": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Emmy_Award.jpg/440px-Emmy_Award.jpg",
  "tv-shows-classic-tv": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Vintage_television.jpg/440px-Vintage_television.jpg",
  "tv-shows-crime-thriller": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Film_noir_style.jpg/640px-Film_noir_style.jpg",
  "tv-shows-documentary": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/David_Attenborough.jpg/440px-David_Attenborough.jpg",
  "tv-shows-drama": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Film_strip.jpg/440px-Film_strip.jpg",
  "tv-shows-reality": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Television_studio.jpg/640px-Television_studio.jpg",
  "tv-shows-sci-fi-fantasy": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/640px-Star_Wars_Logo.svg.png",
  "tv-shows-sitcoms": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Friends_logo.svg/640px-Friends_logo.svg.png",
  "tv-shows-talk-shows": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Television_studio.jpg/640px-Television_studio.jpg",

  // Video Games
  "video-games-action": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "video-games-consoles": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "video-games-esports": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Esports_event.jpg/640px-Esports_event.jpg",
  "video-games-fps": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "video-games-gaming-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Atari_2600.jpg/640px-Atari_2600.jpg",
  "video-games-history": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Atari_2600.jpg/640px-Atari_2600.jpg",
  "video-games-nintendo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Nintendo.svg/640px-Nintendo.svg.png",
  "video-games-pc-games": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Steam_icon_logo.svg/440px-Steam_icon_logo.svg.png",
  "video-games-playstation": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/PlayStation_logo.svg/640px-PlayStation_logo.svg.png",
  "video-games-puzzle": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "video-games-retro": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Atari_2600.jpg/640px-Atari_2600.jpg",
  "video-games-rpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "video-games-sports-racing": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",
  "video-games-strategy": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Video_game_controller.jpg/640px-Video_game_controller.jpg",

  // World Cultures
  "world-cultures-ceremonies": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Indian_wedding.jpg/640px-Indian_wedding.jpg",
  "world-cultures-clothing": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Traditional_Japanese_clothing.jpg/440px-Traditional_Japanese_clothing.jpg",
  "world-cultures-cultural-icons": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/440px-Tour_Eiffel_Wikimedia_Commons.jpg",
  "world-cultures-dance": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Bharatanatyam.jpg/440px-Bharatanatyam.jpg",
  "world-cultures-etiquette": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Traditional_Japanese_clothing.jpg/440px-Traditional_Japanese_clothing.jpg",
  "world-cultures-fashion": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Fashion_show.jpg/640px-Fashion_show.jpg",
  "world-cultures-festivals": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Holi_celebrations.jpg/640px-Holi_celebrations.jpg",
  "world-cultures-folk-arts": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/African_mask.jpg/440px-African_mask.jpg",
  "world-cultures-heritage": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
  "world-cultures-india": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Taj_Mahal_in_March_2004.jpg/640px-Taj_Mahal_in_March_2004.jpg",
  "world-cultures-indigenous": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Totem_pole.jpg/440px-Totem_pole.jpg",
  "world-cultures-traditions": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Holi_celebrations.jpg/640px-Holi_celebrations.jpg",
};

// Ensure images directory exists
if (!existsSync("images")) {
  mkdirSync("images");
}

function fetchImage(key: string, url: string): boolean {
  const outfile = `images/${key}.jpg`;

  if (existsSync(outfile)) {
    return true; // Already exists, skip silently
  }

  // Use curl for reliable Wikipedia downloads
  const result = spawnSync("curl", [
    "-s", "-f", "-L",
    "-H", "User-Agent: QuizQuestionGenerator/1.0",
    "-o", outfile,
    url
  ], { timeout: 30000 });

  if (result.status === 0 && existsSync(outfile)) {
    const size = statSync(outfile).size;
    if (size > 1000) {
      console.log(`OK: ${key} (${Math.round(size / 1024)}KB)`);
      return true;
    }
  }

  // Clean up failed download
  try { require("fs").unlinkSync(outfile); } catch {}
  return false;
}

console.log(`=== Fetching ${Object.keys(SUBCATEGORY_IMAGES).length} Subcategory Images ===\n`);

let success = 0;
let skipped = 0;
let failed = 0;

for (const [key, url] of Object.entries(SUBCATEGORY_IMAGES)) {
  if (existsSync(`images/${key}.jpg`)) {
    skipped++;
    continue;
  }

  const result = fetchImage(key, url);
  if (result) {
    success++;
  } else {
    failed++;
  }
}

console.log(`\nResults: ${success} fetched, ${skipped} skipped, ${failed} failed`);

// Resize large images
console.log("\n=== Resizing Large Images ===\n");
const files = readdirSync("images").filter((f) => f.endsWith(".jpg") && f.includes("-") && !f.includes("--"));
let resized = 0;

for (const f of files) {
  const path = `images/${f}`;
  const size = statSync(path).size;
  if (size > 100000) {
    spawnSync("sips", ["-Z", "600", path]);
    resized++;
  }
}

console.log(`Resized ${resized} images`);
console.log("\nAll done!");
