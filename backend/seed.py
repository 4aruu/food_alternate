import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Food, Nutrition, Allergen, Sustainability

# --- 1. THE PRECISION DATABASE (Lab-Grade Estimates per Standard Serving) ---
REAL_NUTRITION_DB = {
    # BREAKFAST
    "Puttu & Kadala Curry": {"calories": 420, "protein": 14, "carbohydrates": 72, "fat": 8, "fiber": 9, "sugar": 3,
                             "sodium": 450},
    "Ragi Puttu": {"calories": 320, "protein": 10, "carbohydrates": 65, "fat": 2, "fiber": 11, "sugar": 1,
                   "sodium": 20},
    "Wheat Puttu": {"calories": 350, "protein": 12, "carbohydrates": 70, "fat": 3, "fiber": 10, "sugar": 1,
                    "sodium": 25},
    "Appam & Vegetable Stew": {"calories": 480, "protein": 5, "carbohydrates": 55, "fat": 30, "fiber": 4, "sugar": 6,
                               "sodium": 320},
    "Vellayappam": {"calories": 120, "protein": 2, "carbohydrates": 25, "fat": 1, "fiber": 1, "sugar": 2, "sodium": 50},
    "Idiyappam & Egg Curry": {"calories": 340, "protein": 14, "carbohydrates": 42, "fat": 12, "fiber": 2, "sugar": 2,
                              "sodium": 380},
    "Noolputtu (Idiyappam)": {"calories": 225, "protein": 1.2, "carbohydrates": 75, "fat": 0, "fiber": 1, "sugar": 0,
                              "sodium": 10},
    "Upma (Rava)": {"calories": 350, "protein": 8, "carbohydrates": 55, "fat": 12, "fiber": 3, "sugar": 3,
                    "sodium": 400},
    "Broken Wheat Upma": {"calories": 320, "protein": 11, "carbohydrates": 60, "fat": 8, "fiber": 9, "sugar": 2,
                          "sodium": 350},
    "Masala Dosa": {"calories": 380, "protein": 8, "carbohydrates": 58, "fat": 12, "fiber": 4, "sugar": 3,
                    "sodium": 400},
    "Ghee Roast Dosa": {"calories": 450, "protein": 6, "carbohydrates": 55, "fat": 22, "fiber": 2, "sugar": 1,
                        "sodium": 350},
    "Thattu Dosa": {"calories": 90, "protein": 2, "carbohydrates": 15, "fat": 2, "fiber": 1, "sugar": 0, "sodium": 80},
    "Kallappam": {"calories": 110, "protein": 2, "carbohydrates": 22, "fat": 1, "fiber": 1, "sugar": 2, "sodium": 40},
    "Idli": {"calories": 180, "protein": 6, "carbohydrates": 36, "fat": 1, "fiber": 3, "sugar": 0, "sodium": 150},
    "Poori & Masala": {"calories": 550, "protein": 10, "carbohydrates": 65, "fat": 28, "fiber": 5, "sugar": 2,
                       "sodium": 400},
    "Chapati": {"calories": 200, "protein": 6, "carbohydrates": 36, "fat": 4, "fiber": 6, "sugar": 0, "sodium": 30},
    "Naan": {"calories": 260, "protein": 8, "carbohydrates": 45, "fat": 5, "fiber": 2, "sugar": 1, "sodium": 300},
    "Bhatura": {"calories": 300, "protein": 7, "carbohydrates": 40, "fat": 12, "fiber": 2, "sugar": 1, "sodium": 200},
    "Chakka Puttu": {"calories": 300, "protein": 4, "carbohydrates": 65, "fat": 5, "fiber": 8, "sugar": 12,
                     "sodium": 20},
    "Sooji Dosa": {"calories": 140, "protein": 3, "carbohydrates": 25, "fat": 4, "fiber": 1, "sugar": 1, "sodium": 100},
    "Ragi Dosa": {"calories": 120, "protein": 4, "carbohydrates": 22, "fat": 2, "fiber": 3, "sugar": 0, "sodium": 80},
    "Neer Dosa": {"calories": 90, "protein": 1, "carbohydrates": 20, "fat": 0.5, "fiber": 0.5, "sugar": 0,
                  "sodium": 60},
    "Idli Upma": {"calories": 250, "protein": 6, "carbohydrates": 40, "fat": 8, "fiber": 3, "sugar": 1, "sodium": 300},

    # MEALS (KERALA)
    "Kerala Sadhya": {"calories": 750, "protein": 18, "carbohydrates": 110, "fat": 22, "fiber": 15, "sugar": 8,
                      "sodium": 900},
    "Malabar Chicken Biryani": {"calories": 720, "protein": 38, "carbohydrates": 75, "fat": 28, "fiber": 4, "sugar": 2,
                                "sodium": 850},
    "Kanji & Payar": {"calories": 310, "protein": 10, "carbohydrates": 62, "fat": 2, "fiber": 6, "sugar": 1,
                      "sodium": 400},
    "Kappa & Meen Curry": {"calories": 600, "protein": 32, "carbohydrates": 80, "fat": 18, "fiber": 6, "sugar": 4,
                           "sodium": 800},
    "Ghee Rice (Neychoru)": {"calories": 480, "protein": 6, "carbohydrates": 70, "fat": 18, "fiber": 2, "sugar": 1,
                             "sodium": 400},
    "Pothichoru": {"calories": 650, "protein": 22, "carbohydrates": 95, "fat": 18, "fiber": 8, "sugar": 3,
                   "sodium": 700},
    "Curd Rice": {"calories": 350, "protein": 9, "carbohydrates": 50, "fat": 12, "fiber": 2, "sugar": 2, "sodium": 300},
    "Veg Pulao": {"calories": 400, "protein": 8, "carbohydrates": 65, "fat": 10, "fiber": 5, "sugar": 2, "sodium": 350},
    "Thenga Choru": {"calories": 420, "protein": 6, "carbohydrates": 60, "fat": 15, "fiber": 4, "sugar": 2,
                     "sodium": 300},
    "Matta Rice": {"calories": 150, "protein": 3, "carbohydrates": 32, "fat": 1, "fiber": 2, "sugar": 0, "sodium": 5},
    "Erachi Choru": {"calories": 600, "protein": 25, "carbohydrates": 65, "fat": 22, "fiber": 3, "sugar": 1,
                     "sodium": 650},
    "Kappabiriyani (Ellum Kappayum)": {"calories": 650, "protein": 28, "carbohydrates": 60, "fat": 25, "fiber": 5,
                                       "sugar": 2, "sodium": 700},
    "Pidi & Chicken Curry": {"calories": 450, "protein": 20, "carbohydrates": 65, "fat": 15, "fiber": 3, "sugar": 2,
                             "sodium": 500},
    "Kozhi Nirachathu": {"calories": 650, "protein": 45, "carbohydrates": 10, "fat": 40, "fiber": 2, "sugar": 1,
                         "sodium": 600},
    "Kozhi Varutharacha Curry": {"calories": 420, "protein": 25, "carbohydrates": 12, "fat": 30, "fiber": 4, "sugar": 3,
                                 "sodium": 500},
    "Paal Kappa": {"calories": 450, "protein": 3, "carbohydrates": 80, "fat": 12, "fiber": 4, "sugar": 6,
                   "sodium": 150},
    "Kozhi Ishtu": {"calories": 320, "protein": 22, "carbohydrates": 15, "fat": 18, "fiber": 3, "sugar": 4,
                    "sodium": 400},
    "Kozhi Sukka": {"calories": 380, "protein": 30, "carbohydrates": 5, "fat": 25, "fiber": 2, "sugar": 1,
                    "sodium": 450},
    "Kappa Puzhukku & Chammanthi": {"calories": 400, "protein": 4, "carbohydrates": 85, "fat": 5, "fiber": 5,
                                    "sugar": 4, "sodium": 200},
    "Kozhi Pidichathu": {"calories": 400, "protein": 32, "carbohydrates": 8, "fat": 25, "fiber": 2, "sugar": 1,
                         "sodium": 500},
    "Kozhi Pepper Fry": {"calories": 350, "protein": 28, "carbohydrates": 6, "fat": 24, "fiber": 2, "sugar": 0,
                         "sodium": 450},
    "Kozhi Kurumulaku Curry": {"calories": 380, "protein": 26, "carbohydrates": 10, "fat": 25, "fiber": 3, "sugar": 1,
                               "sodium": 450},
    "Kappa Biriyani (Veg)": {"calories": 450, "protein": 6, "carbohydrates": 85, "fat": 10, "fiber": 6, "sugar": 3,
                             "sodium": 350},
    "Kozhi Stew (White)": {"calories": 320, "protein": 24, "carbohydrates": 10, "fat": 20, "fiber": 2, "sugar": 3,
                           "sodium": 350},
    "Ragi Kali & Curry": {"calories": 300, "protein": 8, "carbohydrates": 60, "fat": 4, "fiber": 8, "sugar": 1,
                          "sodium": 200},

    # ARABIC
    "Chicken Shawarma": {"calories": 450, "protein": 25, "carbohydrates": 35, "fat": 22, "fiber": 2, "sugar": 2,
                         "sodium": 650},
    "Beef Shawarma": {"calories": 500, "protein": 28, "carbohydrates": 35, "fat": 26, "fiber": 2, "sugar": 2,
                      "sodium": 700},
    "Chicken Mandi": {"calories": 850, "protein": 40, "carbohydrates": 90, "fat": 35, "fiber": 3, "sugar": 1,
                      "sodium": 950},
    "Al Faham Chicken": {"calories": 380, "protein": 35, "carbohydrates": 5, "fat": 24, "fiber": 1, "sugar": 1,
                         "sodium": 500},
    "Kuboos (Pita Bread)": {"calories": 180, "protein": 6, "carbohydrates": 35, "fat": 1, "fiber": 2, "sugar": 1,
                            "sodium": 200},
    "Hummus": {"calories": 170, "protein": 5, "carbohydrates": 15, "fat": 10, "fiber": 4, "sugar": 0, "sodium": 250},
    "Falafel": {"calories": 60, "protein": 3, "carbohydrates": 7, "fat": 3, "fiber": 2, "sugar": 0, "sodium": 100},
    "Grilled Shish Tawook": {"calories": 300, "protein": 32, "carbohydrates": 4, "fat": 15, "fiber": 1, "sugar": 1,
                             "sodium": 450},

    # CHINESE
    "Chicken Fried Rice": {"calories": 550, "protein": 18, "carbohydrates": 70, "fat": 20, "fiber": 2, "sugar": 2,
                           "sodium": 800},
    "Schezwan Chicken Noodles": {"calories": 600, "protein": 20, "carbohydrates": 75, "fat": 22, "fiber": 3, "sugar": 4,
                                 "sodium": 950},
    "Gobi Manchurian (Dry)": {"calories": 350, "protein": 6, "carbohydrates": 45, "fat": 18, "fiber": 4, "sugar": 6,
                              "sodium": 900},
    "Chilli Chicken (Dry)": {"calories": 400, "protein": 30, "carbohydrates": 15, "fat": 25, "fiber": 2, "sugar": 5,
                             "sodium": 850},
    "Chicken Momos (Steamed)": {"calories": 250, "protein": 12, "carbohydrates": 35, "fat": 6, "fiber": 1, "sugar": 1,
                                "sodium": 350},
    "Spring Rolls": {"calories": 200, "protein": 4, "carbohydrates": 25, "fat": 10, "fiber": 2, "sugar": 2,
                     "sodium": 400},

    # INDIAN
    "Butter Naan": {"calories": 320, "protein": 8, "carbohydrates": 48, "fat": 10, "fiber": 2, "sugar": 2,
                    "sodium": 350},
    "Garlic Naan": {"calories": 330, "protein": 8, "carbohydrates": 48, "fat": 11, "fiber": 2, "sugar": 2,
                    "sodium": 360},
    "Tandoori Chicken (Half)": {"calories": 450, "protein": 45, "carbohydrates": 8, "fat": 22, "fiber": 2, "sugar": 1,
                                "sodium": 600},
    "Dal Makhani": {"calories": 400, "protein": 12, "carbohydrates": 25, "fat": 28, "fiber": 8, "sugar": 3,
                    "sodium": 500},
    "Palak Paneer": {"calories": 350, "protein": 16, "carbohydrates": 12, "fat": 26, "fiber": 6, "sugar": 3,
                     "sodium": 600},
    "Chicken Tikka Masala": {"calories": 500, "protein": 30, "carbohydrates": 18, "fat": 35, "fiber": 3, "sugar": 6,
                             "sodium": 750},

    # FAST FOOD
    "Cheeseburger": {"calories": 550, "protein": 25, "carbohydrates": 45, "fat": 30, "fiber": 2, "sugar": 9,
                     "sodium": 950},
    "French Fries (Medium)": {"calories": 380, "protein": 4, "carbohydrates": 48, "fat": 19, "fiber": 4, "sugar": 0,
                              "sodium": 280},
    "Pepperoni Pizza (Slice)": {"calories": 300, "protein": 12, "carbohydrates": 35, "fat": 14, "fiber": 2, "sugar": 3,
                                "sodium": 650},
    "Fried Chicken (2pc)": {"calories": 580, "protein": 35, "carbohydrates": 25, "fat": 38, "fiber": 1, "sugar": 0,
                            "sodium": 1100},
    "Club Sandwich": {"calories": 450, "protein": 22, "carbohydrates": 40, "fat": 22, "fiber": 4, "sugar": 5,
                      "sodium": 800},

    # SEAFOOD
    "Karimeen Pollichathu": {"calories": 320, "protein": 35, "carbohydrates": 8, "fat": 16, "fiber": 3, "sugar": 2,
                             "sodium": 550},
    "Mathi Fry (Sardine)": {"calories": 280, "protein": 24, "carbohydrates": 4, "fat": 18, "fiber": 0, "sugar": 0,
                            "sodium": 300},
    "Mathi Curry": {"calories": 250, "protein": 22, "carbohydrates": 6, "fat": 15, "fiber": 2, "sugar": 1,
                    "sodium": 400},
    "Ayala Fry (Mackerel)": {"calories": 290, "protein": 25, "carbohydrates": 4, "fat": 18, "fiber": 0, "sugar": 0,
                             "sodium": 300},
    "Ayala Mulakittathu": {"calories": 260, "protein": 24, "carbohydrates": 6, "fat": 14, "fiber": 2, "sugar": 1,
                           "sodium": 450},
    "Beef Ularthiyathu": {"calories": 420, "protein": 28, "carbohydrates": 6, "fat": 32, "fiber": 2, "sugar": 1,
                          "sodium": 600},
    "Porotta & Beef Fry": {"calories": 950, "protein": 38, "carbohydrates": 85, "fat": 52, "fiber": 4, "sugar": 2,
                           "sodium": 1100},
    "Nadan Kozhi Curry": {"calories": 350, "protein": 28, "carbohydrates": 8, "fat": 22, "fiber": 3, "sugar": 2,
                          "sodium": 500},
    "Kakkayirachi (Clams)": {"calories": 180, "protein": 22, "carbohydrates": 5, "fat": 8, "fiber": 1, "sugar": 0,
                             "sodium": 250},
    "Butter Chicken": {"calories": 600, "protein": 30, "carbohydrates": 15, "fat": 45, "fiber": 2, "sugar": 6,
                       "sodium": 700},
    "Chilli Chicken": {"calories": 450, "protein": 28, "carbohydrates": 20, "fat": 25, "fiber": 2, "sugar": 8,
                       "sodium": 800},
    "Fish and Chips": {"calories": 800, "protein": 25, "carbohydrates": 75, "fat": 45, "fiber": 4, "sugar": 2,
                       "sodium": 900},
    "Grilled Salmon": {"calories": 380, "protein": 35, "carbohydrates": 2, "fat": 20, "fiber": 2, "sugar": 0,
                       "sodium": 150},
    "Shepherd's Pie": {"calories": 580, "protein": 22, "carbohydrates": 45, "fat": 28, "fiber": 5, "sugar": 3,
                       "sodium": 650},
    "Beef Fry": {"calories": 350, "protein": 25, "carbohydrates": 5, "fat": 25, "fiber": 1, "sugar": 0, "sodium": 450},
    "Chicken Stew": {"calories": 300, "protein": 25, "carbohydrates": 10, "fat": 18, "fiber": 2, "sugar": 3,
                     "sodium": 400},
    "Duck Roast (Tharavu)": {"calories": 450, "protein": 28, "carbohydrates": 8, "fat": 35, "fiber": 1, "sugar": 1,
                             "sodium": 550},
    "Pork Fry (Angamaly)": {"calories": 500, "protein": 22, "carbohydrates": 5, "fat": 40, "fiber": 1, "sugar": 0,
                            "sodium": 600},
    "Liver Fry": {"calories": 250, "protein": 26, "carbohydrates": 6, "fat": 12, "fiber": 0, "sugar": 0, "sodium": 350},
    "Pathiri & Chicken Curry": {"calories": 400, "protein": 18, "carbohydrates": 55, "fat": 12, "fiber": 3, "sugar": 2,
                                "sodium": 450},
    "Meen Peera": {"calories": 180, "protein": 22, "carbohydrates": 6, "fat": 8, "fiber": 3, "sugar": 1, "sodium": 200},
    "Meen Mulakittathu (Earthen Pot)": {"calories": 250, "protein": 28, "carbohydrates": 6, "fat": 12, "fiber": 2,
                                        "sugar": 1, "sodium": 400},
    "Thenga Aracha Meen Curry": {"calories": 320, "protein": 25, "carbohydrates": 10, "fat": 20, "fiber": 3, "sugar": 2,
                                 "sodium": 400},
    "Meen Varutharacha Curry": {"calories": 350, "protein": 26, "carbohydrates": 12, "fat": 22, "fiber": 3, "sugar": 2,
                                "sodium": 400},
    "Netholi Peera": {"calories": 180, "protein": 20, "carbohydrates": 8, "fat": 7, "fiber": 2, "sugar": 1,
                      "sodium": 250},
    "Kallummakkaya Nirachathu": {"calories": 280, "protein": 15, "carbohydrates": 25, "fat": 14, "fiber": 2, "sugar": 1,
                                 "sodium": 300},
    "Chemmeen Roast (Prawns)": {"calories": 320, "protein": 28, "carbohydrates": 8, "fat": 18, "fiber": 2, "sugar": 1,
                                "sodium": 400},
    "Njandu Roast (Crab)": {"calories": 350, "protein": 30, "carbohydrates": 6, "fat": 22, "fiber": 2, "sugar": 1,
                            "sodium": 450},
    "Neymeen Curry (Seer Fish)": {"calories": 380, "protein": 32, "carbohydrates": 8, "fat": 24, "fiber": 2, "sugar": 2,
                                  "sodium": 400},
    "Koonthal Roast (Squid)": {"calories": 300, "protein": 25, "carbohydrates": 6, "fat": 18, "fiber": 1, "sugar": 0,
                               "sodium": 350},

    # VEG SIDES
    "Avial": {"calories": 180, "protein": 5, "carbohydrates": 15, "fat": 12, "fiber": 6, "sugar": 3, "sodium": 120},
    "Cabbage Thoran": {"calories": 120, "protein": 3, "carbohydrates": 12, "fat": 7, "fiber": 5, "sugar": 3,
                       "sodium": 100},
    "Sambar": {"calories": 150, "protein": 6, "carbohydrates": 20, "fat": 5, "fiber": 4, "sugar": 2, "sodium": 400},
    "Moru Curry": {"calories": 180, "protein": 4, "carbohydrates": 7, "fat": 5, "fiber": 1, "sugar": 2, "sodium": 300},
    "Kappa Mezhukkupuratti": {"calories": 300, "protein": 2, "carbohydrates": 55, "fat": 10, "fiber": 4, "sugar": 2,
                              "sodium": 150},
    "Chena Mezhukkupuratti": {"calories": 250, "protein": 3, "carbohydrates": 45, "fat": 8, "fiber": 5, "sugar": 1,
                              "sodium": 120},
    "Koon Curry": {"calories": 150, "protein": 8, "carbohydrates": 10, "fat": 10, "fiber": 4, "sugar": 2,
                   "sodium": 250},
    "Kozhi Thoran": {"calories": 280, "protein": 28, "carbohydrates": 8, "fat": 15, "fiber": 3, "sugar": 1,
                     "sodium": 300},
    "Muringakka Thoran": {"calories": 120, "protein": 4, "carbohydrates": 15, "fat": 6, "fiber": 5, "sugar": 2,
                          "sodium": 100},
    "Kakka Erissery": {"calories": 220, "protein": 18, "carbohydrates": 15, "fat": 10, "fiber": 3, "sugar": 2,
                       "sodium": 250},
    "Egg Roast Kerala Style": {"calories": 220, "protein": 14, "carbohydrates": 8, "fat": 16, "fiber": 1, "sugar": 3,
                               "sodium": 300},
    "Ulli Theeyal (Small Onion)": {"calories": 180, "protein": 3, "carbohydrates": 20, "fat": 10, "fiber": 3,
                                   "sugar": 5, "sodium": 250},
    "Raw Mango Pulissery": {"calories": 160, "protein": 4, "carbohydrates": 18, "fat": 8, "fiber": 2, "sugar": 6,
                            "sodium": 300},
    "Kumbalanga Pulissery": {"calories": 140, "protein": 3, "carbohydrates": 15, "fat": 7, "fiber": 4, "sugar": 3,
                             "sodium": 200},
    "Kozhi Pachadi": {"calories": 200, "protein": 18, "carbohydrates": 8, "fat": 10, "fiber": 2, "sugar": 2,
                      "sodium": 250},
    "Kumbalanga Thoran": {"calories": 90, "protein": 2, "carbohydrates": 12, "fat": 4, "fiber": 4, "sugar": 2,
                          "sodium": 80},
    "Beans Mezhukkupuratti": {"calories": 130, "protein": 4, "carbohydrates": 14, "fat": 7, "fiber": 5, "sugar": 3,
                              "sodium": 150},
    "Kovakka Fry": {"calories": 160, "protein": 2, "carbohydrates": 18, "fat": 9, "fiber": 3, "sugar": 2,
                    "sodium": 120},
    "Pavakka Theeyal": {"calories": 200, "protein": 4, "carbohydrates": 22, "fat": 12, "fiber": 4, "sugar": 6,
                        "sodium": 280},
    "Kalan": {"calories": 220, "protein": 5, "carbohydrates": 25, "fat": 10, "fiber": 6, "sugar": 4, "sodium": 250},
    "Olan": {"calories": 180, "protein": 6, "carbohydrates": 20, "fat": 8, "fiber": 5, "sugar": 2, "sodium": 200},
    "Erissery": {"calories": 240, "protein": 7, "carbohydrates": 30, "fat": 10, "fiber": 6, "sugar": 5, "sodium": 220},
    "Koottu Curry": {"calories": 260, "protein": 10, "carbohydrates": 35, "fat": 8, "fiber": 8, "sugar": 4,
                     "sodium": 300},
    "Potato Stew": {"calories": 280, "protein": 4, "carbohydrates": 40, "fat": 12, "fiber": 4, "sugar": 3,
                    "sodium": 350},
    "Pulissery": {"calories": 190, "protein": 4, "carbohydrates": 15, "fat": 12, "fiber": 2, "sugar": 6, "sodium": 250},
    "Rasam": {"calories": 60, "protein": 1, "carbohydrates": 10, "fat": 1, "fiber": 1, "sugar": 1, "sodium": 400},
    "Theeyal (Ulli)": {"calories": 210, "protein": 3, "carbohydrates": 25, "fat": 11, "fiber": 4, "sugar": 8,
                       "sodium": 300},
    "Inji Curry": {"calories": 150, "protein": 2, "carbohydrates": 20, "fat": 6, "fiber": 2, "sugar": 15,
                   "sodium": 450},
    "Vendakka Kichadi": {"calories": 140, "protein": 3, "carbohydrates": 12, "fat": 9, "fiber": 4, "sugar": 3,
                         "sodium": 200},
    "Beetroot Pachadi": {"calories": 160, "protein": 3, "carbohydrates": 18, "fat": 8, "fiber": 3, "sugar": 8,
                         "sodium": 220},
    "Pineapple Pachadi": {"calories": 180, "protein": 2, "carbohydrates": 25, "fat": 6, "fiber": 3, "sugar": 15,
                          "sodium": 200},

    # SNACKS
    "Pazhampori": {"calories": 180, "protein": 1, "carbohydrates": 32, "fat": 7, "fiber": 2, "sugar": 14, "sodium": 50},
    "Parippuvada": {"calories": 90, "protein": 4, "carbohydrates": 12, "fat": 4, "fiber": 3, "sugar": 1, "sodium": 120},
    "Palada Payasam": {"calories": 480, "protein": 8, "carbohydrates": 65, "fat": 18, "sugar": 45, "fiber": 0,
                       "sodium": 120},
    "Unniyappam": {"calories": 85, "protein": 1, "carbohydrates": 16, "fat": 3, "sugar": 8, "fiber": 1, "sodium": 20},
    "Kozhikodan Halwa (Black)": {"calories": 550, "protein": 2, "carbohydrates": 85, "fat": 24, "sugar": 60, "fiber": 1,
                                 "sodium": 10},
    "Jalebi": {"calories": 150, "protein": 0, "carbohydrates": 35, "fat": 8, "sugar": 30, "fiber": 0, "sodium": 5},
    "Gulab Jamun": {"calories": 175, "protein": 2, "carbohydrates": 30, "fat": 10, "sugar": 25, "fiber": 0,
                    "sodium": 10},
    "Donut": {"calories": 350, "protein": 4, "carbohydrates": 45, "fat": 18, "sugar": 20, "fiber": 1, "sodium": 200},
    "Pancakes & Maple Syrup": {"calories": 550, "protein": 8, "carbohydrates": 90, "fat": 15, "fiber": 1, "sugar": 45,
                               "sodium": 600},
    "Uzhunnu Vada": {"calories": 120, "protein": 4, "carbohydrates": 15, "fat": 6, "fiber": 2, "sugar": 0,
                     "sodium": 150},
    "Sukhiyan": {"calories": 140, "protein": 4, "carbohydrates": 28, "fat": 3, "fiber": 3, "sugar": 12, "sodium": 50},
    "Bonda (Potato)": {"calories": 160, "protein": 3, "carbohydrates": 25, "fat": 6, "fiber": 2, "sugar": 1,
                       "sodium": 200},
    "Vettucake": {"calories": 200, "protein": 3, "carbohydrates": 35, "fat": 6, "fiber": 1, "sugar": 15, "sodium": 80},
    "Achappam": {"calories": 80, "protein": 1, "carbohydrates": 12, "fat": 3, "fiber": 0, "sugar": 4, "sodium": 20},
    "Kuzhalappam": {"calories": 100, "protein": 1, "carbohydrates": 18, "fat": 4, "fiber": 1, "sugar": 2, "sodium": 40},
    "Unnakaya": {"calories": 220, "protein": 2, "carbohydrates": 40, "fat": 6, "fiber": 3, "sugar": 18, "sodium": 30},
    "Chicken Cutlet": {"calories": 200, "protein": 12, "carbohydrates": 15, "fat": 10, "fiber": 1, "sugar": 1,
                       "sodium": 250},
    "Egg Puffs": {"calories": 300, "protein": 8, "carbohydrates": 25, "fat": 18, "fiber": 1, "sugar": 1, "sodium": 300},
    "Meat Rolls": {"calories": 280, "protein": 10, "carbohydrates": 22, "fat": 16, "fiber": 1, "sugar": 1,
                   "sodium": 350},
    "Bread Omelette": {"calories": 320, "protein": 14, "carbohydrates": 28, "fat": 16, "fiber": 2, "sugar": 3,
                       "sodium": 400},
    "Diamond Cuts (Madakkusan)": {"calories": 120, "protein": 1, "carbohydrates": 20, "fat": 4, "fiber": 0, "sugar": 8,
                                  "sodium": 30},
    "Avalose Podi": {"calories": 400, "protein": 5, "carbohydrates": 75, "fat": 8, "fiber": 4, "sugar": 15,
                     "sodium": 10},
    "Elayappam": {"calories": 250, "protein": 3, "carbohydrates": 45, "fat": 6, "fiber": 3, "sugar": 20, "sodium": 20},
    "Ottada": {"calories": 180, "protein": 3, "carbohydrates": 35, "fat": 4, "fiber": 2, "sugar": 5, "sodium": 50},
    "Vattayappam": {"calories": 220, "protein": 4, "carbohydrates": 45, "fat": 2, "fiber": 1, "sugar": 15,
                    "sodium": 60},
    "Pessaha Appam": {"calories": 200, "protein": 3, "carbohydrates": 42, "fat": 2, "fiber": 2, "sugar": 0,
                      "sodium": 100},
    "Kozhukatta (Steamed)": {"calories": 220, "protein": 3, "carbohydrates": 48, "fat": 4, "fiber": 2, "sugar": 15,
                             "sodium": 10},
    "Ela Ada": {"calories": 180, "protein": 2, "carbohydrates": 40, "fat": 3, "fiber": 2, "sugar": 12, "sodium": 5},
    "Upperi (Raw Banana Fry)": {"calories": 140, "protein": 1, "carbohydrates": 25, "fat": 6, "fiber": 2, "sugar": 0,
                                "sodium": 80},
    "Kumbilappam (Rice)": {"calories": 160, "protein": 2, "carbohydrates": 35, "fat": 2, "fiber": 2, "sugar": 10,
                           "sodium": 5},
    "Kappa Roast": {"calories": 350, "protein": 2, "carbohydrates": 60, "fat": 12, "fiber": 4, "sugar": 2,
                    "sodium": 300},
    "Kappa Chips (Spicy)": {"calories": 180, "protein": 1, "carbohydrates": 30, "fat": 8, "fiber": 2, "sugar": 0,
                            "sodium": 150},
    "Kozhi Thattukada Fry": {"calories": 480, "protein": 30, "carbohydrates": 15, "fat": 35, "fiber": 1, "sugar": 1,
                             "sodium": 600},
    "Neyyappam": {"calories": 160, "protein": 2, "carbohydrates": 25, "fat": 8, "fiber": 1, "sugar": 12, "sodium": 20},
    "Chattipathiri": {"calories": 350, "protein": 8, "carbohydrates": 45, "fat": 16, "fiber": 2, "sugar": 20,
                      "sodium": 150},
    "Rasgulla": {"calories": 120, "protein": 3, "carbohydrates": 28, "fat": 1, "fiber": 0, "sugar": 25, "sodium": 5},
    "Mysore Pak": {"calories": 380, "protein": 4, "carbohydrates": 45, "fat": 22, "fiber": 1, "sugar": 35,
                   "sodium": 10},
    "Kesari Bath": {"calories": 280, "protein": 3, "carbohydrates": 40, "fat": 12, "fiber": 1, "sugar": 25,
                    "sodium": 10},
    "Mutta Mala": {"calories": 250, "protein": 6, "carbohydrates": 35, "fat": 10, "fiber": 0, "sugar": 30,
                   "sodium": 20},

    # DESSERTS (missing)
    "Semiya Payasam": {"calories": 350, "protein": 6, "carbohydrates": 55, "fat": 12, "fiber": 1, "sugar": 35,
                       "sodium": 60},
    "Ada Pradhaman": {"calories": 380, "protein": 4, "carbohydrates": 65, "fat": 14, "fiber": 2, "sugar": 40,
                      "sodium": 30},
    "Parippu Payasam": {"calories": 320, "protein": 8, "carbohydrates": 50, "fat": 10, "fiber": 4, "sugar": 30,
                        "sodium": 25},
    "Wheat Payasam (Gothambu)": {"calories": 340, "protein": 7, "carbohydrates": 55, "fat": 10, "fiber": 3,
                                 "sugar": 28, "sodium": 30},
    "Kozhikode Halwa (Red)": {"calories": 500, "protein": 2, "carbohydrates": 80, "fat": 20, "sugar": 55, "fiber": 0,
                               "sodium": 10},
    "Rava Kesari (South Indian)": {"calories": 300, "protein": 3, "carbohydrates": 42, "fat": 14, "fiber": 1,
                                    "sugar": 28, "sodium": 15},
    "Paalada Pradhaman (Jaggery)": {"calories": 400, "protein": 5, "carbohydrates": 60, "fat": 16, "fiber": 1,
                                     "sugar": 38, "sodium": 40},
    "Chakka Varatti": {"calories": 280, "protein": 2, "carbohydrates": 60, "fat": 5, "fiber": 3, "sugar": 40,
                       "sodium": 10},

    # DRINKS
    "Kulukki Sarbath": {"calories": 80, "protein": 0, "carbohydrates": 20, "fat": 0, "fiber": 1, "sugar": 18,
                        "sodium": 100},
    "Sambharam (Spiced Buttermilk)": {"calories": 40, "protein": 2, "carbohydrates": 3, "fat": 1, "fiber": 0,
                                      "sugar": 2, "sodium": 250},
    "Avil Milk": {"calories": 350, "protein": 8, "carbohydrates": 55, "fat": 12, "fiber": 2, "sugar": 30,
                  "sodium": 80},
    "Nannari Sarbath": {"calories": 70, "protein": 0, "carbohydrates": 18, "fat": 0, "fiber": 0, "sugar": 16,
                        "sodium": 10},
    "Tender Coconut Shake": {"calories": 120, "protein": 1, "carbohydrates": 22, "fat": 3, "fiber": 2, "sugar": 18,
                             "sodium": 40},
    "Sharjah Shake": {"calories": 380, "protein": 10, "carbohydrates": 58, "fat": 12, "fiber": 2, "sugar": 45,
                      "sodium": 120},
    "Tea": {"calories": 50, "protein": 1, "carbohydrates": 8, "fat": 1.5, "fiber": 0, "sugar": 7, "sodium": 20},
    "Coffee": {"calories": 60, "protein": 1, "carbohydrates": 9, "fat": 2, "fiber": 0, "sugar": 8, "sodium": 25},
    "Lassi": {"calories": 150, "protein": 4, "carbohydrates": 25, "fat": 4, "fiber": 0, "sugar": 22, "sodium": 60},
    "Lemonade": {"calories": 45, "protein": 0, "carbohydrates": 12, "fat": 0, "fiber": 0, "sugar": 10, "sodium": 5},

    # JACKFRUIT
    "Chakka Puzhukku": {"calories": 200, "protein": 3, "carbohydrates": 45, "fat": 2, "fiber": 4, "sugar": 5,
                        "sodium": 100},
    "Chakka Chips": {"calories": 250, "protein": 2, "carbohydrates": 35, "fat": 12, "fiber": 3, "sugar": 8,
                     "sodium": 60},
    "Kumbilappam": {"calories": 180, "protein": 2, "carbohydrates": 38, "fat": 3, "fiber": 3, "sugar": 12,
                    "sodium": 10},
    "Chakkakuru Mezhukkupuratti": {"calories": 160, "protein": 5, "carbohydrates": 25, "fat": 6, "fiber": 3,
                                   "sugar": 2, "sodium": 80},

    # CONDIMENTS
    "Chammanthi (Red)": {"calories": 80, "protein": 2, "carbohydrates": 6, "fat": 5, "fiber": 3, "sugar": 1,
                         "sodium": 200},
    "Puli Inji": {"calories": 120, "protein": 1, "carbohydrates": 22, "fat": 4, "fiber": 2, "sugar": 14,
                  "sodium": 350},
    "Naranga Achar": {"calories": 50, "protein": 0, "carbohydrates": 8, "fat": 2, "fiber": 1, "sugar": 3,
                      "sodium": 800},
    "Kadumanga Achar": {"calories": 45, "protein": 0, "carbohydrates": 7, "fat": 2, "fiber": 1, "sugar": 2,
                        "sodium": 750},

    # CONTINENTAL
    "Grilled Chicken Salad": {"calories": 250, "protein": 30, "carbohydrates": 10, "fat": 10, "fiber": 4, "sugar": 3,
                              "sodium": 350},
    "Creamy Mushroom Pasta": {"calories": 550, "protein": 14, "carbohydrates": 65, "fat": 25, "fiber": 3, "sugar": 4,
                              "sodium": 600},
    "Impossible Burger": {"calories": 460, "protein": 20, "carbohydrates": 44, "fat": 22, "fiber": 4, "sugar": 8,
                          "sodium": 700},
    "Avocado Toast": {"calories": 280, "protein": 7, "carbohydrates": 30, "fat": 16, "fiber": 7, "sugar": 2,
                      "sodium": 300},
    "Greek Salad": {"calories": 180, "protein": 6, "carbohydrates": 10, "fat": 14, "fiber": 3, "sugar": 4,
                    "sodium": 450},
    "Vegetable Lasagna": {"calories": 420, "protein": 18, "carbohydrates": 45, "fat": 18, "fiber": 5, "sugar": 6,
                          "sodium": 650},

    # DAIRY / MILK (per 250ml glass)
    "Cow's Milk": {"calories": 150, "protein": 8, "carbohydrates": 12, "fat": 8, "fiber": 0, "sugar": 12,
                   "sodium": 105},
    "Goats's Milk": {"calories": 170, "protein": 9, "carbohydrates": 11, "fat": 10, "fiber": 0, "sugar": 11,
                     "sodium": 120},
    "Skimmed Milk": {"calories": 85, "protein": 8, "carbohydrates": 12, "fat": 0.5, "fiber": 0, "sugar": 12,
                     "sodium": 130},
    "Almond Milk": {"calories": 30, "protein": 1, "carbohydrates": 1, "fat": 2.5, "fiber": 0.5, "sugar": 0,
                    "sodium": 170},
    "Soy Milk": {"calories": 110, "protein": 8, "carbohydrates": 9, "fat": 4.5, "fiber": 1, "sugar": 6,
                 "sodium": 90},
    "Oat Milk": {"calories": 120, "protein": 3, "carbohydrates": 16, "fat": 5, "fiber": 2, "sugar": 7,
                 "sodium": 100},
    "Coconut Milk": {"calories": 45, "protein": 0, "carbohydrates": 1, "fat": 4.5, "fiber": 0, "sugar": 0,
                     "sodium": 15},

    # BREADS (per slice / serving)
    "White Bread": {"calories": 130, "protein": 4, "carbohydrates": 24, "fat": 1.5, "fiber": 1, "sugar": 3,
                    "sodium": 230},
    "Whole Wheat Bread": {"calories": 120, "protein": 5, "carbohydrates": 22, "fat": 2, "fiber": 3, "sugar": 3,
                          "sodium": 200},
    "Multigrain Bread": {"calories": 130, "protein": 5, "carbohydrates": 23, "fat": 2.5, "fiber": 4, "sugar": 3,
                         "sodium": 180},
    "Sourdough Bread": {"calories": 140, "protein": 5, "carbohydrates": 26, "fat": 1, "fiber": 1, "sugar": 1,
                        "sodium": 260},
    "Gluten-Free Bread": {"calories": 120, "protein": 2, "carbohydrates": 22, "fat": 3, "fiber": 2, "sugar": 3,
                          "sodium": 200},

    # SWEETENERS (per tablespoon / 15g serving)
    "White Sugar": {"calories": 50, "protein": 0, "carbohydrates": 13, "fat": 0, "fiber": 0, "sugar": 13,
                    "sodium": 0},
    "Brown Sugar": {"calories": 52, "protein": 0, "carbohydrates": 13.5, "fat": 0, "fiber": 0, "sugar": 13.5,
                    "sodium": 5},
    "Honey": {"calories": 64, "protein": 0, "carbohydrates": 17, "fat": 0, "fiber": 0, "sugar": 17, "sodium": 1},
    "Jaggery": {"calories": 55, "protein": 0.1, "carbohydrates": 14, "fat": 0, "fiber": 0, "sugar": 13,
                "sodium": 3},
    "Stevia": {"calories": 0, "protein": 0, "carbohydrates": 0, "fat": 0, "fiber": 0, "sugar": 0, "sodium": 0},
    "Maple Syrup": {"calories": 52, "protein": 0, "carbohydrates": 13, "fat": 0, "fiber": 0, "sugar": 12,
                    "sodium": 2},

    # VEGAN PROTEIN (per 100g serving)
    "Tofu": {"calories": 145, "protein": 15, "carbohydrates": 3, "fat": 8, "fiber": 1, "sugar": 1, "sodium": 14},
    "Tempeh": {"calories": 195, "protein": 20, "carbohydrates": 8, "fat": 11, "fiber": 5, "sugar": 0, "sodium": 10},
    "Vegan Cheese": {"calories": 250, "protein": 3, "carbohydrates": 18, "fat": 18, "fiber": 1, "sugar": 0,
                     "sodium": 400},
    "Nutritional Yeast": {"calories": 60, "protein": 8, "carbohydrates": 5, "fat": 0.5, "fiber": 3, "sugar": 0,
                          "sodium": 10},
    "Seitan (Wheat Meat)": {"calories": 370, "protein": 75, "carbohydrates": 14, "fat": 2, "fiber": 1, "sugar": 0,
                            "sodium": 50},

    # DINNER / OTHER (missing)
    "Thalassery Pathiri": {"calories": 180, "protein": 3, "carbohydrates": 38, "fat": 2, "fiber": 1, "sugar": 0,
                           "sodium": 150},
    "Kozhi Kothu Porotta": {"calories": 650, "protein": 22, "carbohydrates": 70, "fat": 30, "fiber": 3, "sugar": 3,
                            "sodium": 700},
    "Paneer Butter Masala": {"calories": 400, "protein": 15, "carbohydrates": 14, "fat": 30, "fiber": 2, "sugar": 5,
                             "sodium": 600},
}

# --- 2. THE MASTER LIST (Names & Metadata) ---
raw_native_list = [
    # BREAKFAST
    "Puttu & Kadala Curry|Breakfast|puttu.jpg|Steamed rice cake cylinders with black chickpea curry.",
    "Ragi Puttu|Breakfast|ragiputtu.jpg|Steamed finger millet cake (Healthy, but may contain wheat binder).",
    "Wheat Puttu|Breakfast|wheatputtu.jpg|Steamed whole wheat cake (Contains Gluten).",
    "Appam & Vegetable Stew|Breakfast|appam.jpg|Laced rice pancakes (fermented) with coconut vegetable stew.",
    "Vellayappam|Breakfast|vellayappam.jpg|Fermented rice cake, softer than Appam.",
    "Idiyappam & Egg Curry|Breakfast|idiyappam.jpg|String hoppers (Rice) with roasted egg curry (Contains Egg).",
    "Noolputtu (Idiyappam)|Breakfast|idiyappam.jpg|Steamed rice noodles.",
    "Upma (Rava)|Breakfast|upma.jpg|Semolina porridge with veggies (Contains Gluten/Wheat).",
    "Broken Wheat Upma|Breakfast|wheatupma.jpg|Healthy cracked wheat savory porridge (Contains Gluten).",
    "Masala Dosa|Breakfast|masaladosa.jpg|Fermented crepe filled with potato masala.",
    "Ghee Roast Dosa|Breakfast|gheeroast.jpg|Crispy thin dosa made with clarified butter (Contains Dairy).",
    "Thattu Dosa|Dinner|thattudosa.jpg|Small, soft, spongy dosas.",
    "Kallappam|Breakfast|kallappam.jpg|Toddy fermented rice pancake.",
    "Idli|Breakfast|idli.jpg|Steamed savory rice cake.",
    "Poori & Masala|Breakfast|poori.jpg|Deep fried fluffy wheat bread (Gluten) with potato masala.",
    "Chapati|Breakfast|chapati.jpg|Whole wheat flatbread (Contains Gluten).",
    "Naan|Main Course|naan.jpg|Oven-baked leavened flatbread (Contains Gluten/Maida/Dairy).",
    "Bhatura|Breakfast|bhatura.jpg|Deep fried leavened bread (Contains Gluten/Maida).",
    "Chakka Puttu|Breakfast|chakkaputtu.jpg|Steamed jackfruit puttu with coconut.",
    "Sooji Dosa|Breakfast|soojidosa.jpg|Instant dosa made from semolina batter (Contains Gluten).",
    "Ragi Dosa|Breakfast|ragidosa.jpg|Healthy dosa made from finger millet.",
    "Neer Dosa|Breakfast|neerdosa.jpg|Soft watery rice crepes from coastal Karnataka.",
    "Idli Upma|Breakfast|idliupma.jpg|Crumble-fried leftover idlis with spices.",

    # MEALS
    "Kerala Sadhya|Lunch|sadhya.jpg|Traditional banquet on banana leaf (Vegetarian).",
    "Kappa & Meen Curry|Lunch|kappa.jpg|Mashed tapioca with spicy red fish curry (Contains Fish).",
    "Kanji & Payar|Lunch|kanji.jpg|Rice gruel served with green gram (Comfort food).",
    "Pothichoru|Lunch|pothichoru.jpg|Rice, fish fry, boiled egg/omelette, chammanthi, and curries wrapped in banana leaf (Contains Egg, Fish).",
    "Ghee Rice (Neychoru)|Main Course|neychoru.jpg|Short grain rice cooked in ghee and spices (Contains Dairy).",
    "Thenga Choru|Lunch|thengachoru.jpg|Rice cooked with coconut flakes and mild spices.",
    "Matta Rice|Lunch|mattarice.jpg|Nutritious parboiled red rice (Kerala staple).",
    "Erachi Choru|Main Course|erachichoru.jpg|Rice cooked directly with meat masala.",
    "Kappabiriyani (Ellum Kappayum)|Main Course|kappabiriyani.jpg|Mashed tapioca mixed with beef rib bones.",
    "Malabar Chicken Biryani|Main Course|biryani.jpg|Aromatic Khyma rice cooked with spiced chicken (May contain Ghee/Dairy/Cashew/Nuts).",
    "Curd Rice|Lunch|curdrice.jpg|Rice mixed with yogurt and tempered spices (Contains Dairy).",
    "Veg Pulao|Lunch|pulao.jpg|Rice cooked with mixed vegetables and mild spices.",
    "Pidi & Chicken Curry|Main Course|pidi.jpg|Rice dumplings cooked and served with spicy chicken curry.",
    "Kozhi Nirachathu|Main Course|kozhinirachathu.jpg|Whole chicken stuffed with masala and slow roasted (May contain Egg).",
    "Kozhi Varutharacha Curry|Main Course|kozhi_varutharacha.jpg|Chicken curry with roasted coconut gravy.",
    "Paal Kappa|Main Course|paalkappa.jpg|Tapioca cooked in coconut milk with spices.",
    "Kozhi Ishtu|Main Course|kozhiishtu.jpg|Kerala-style mild chicken stew with vegetables.",
    "Kozhi Sukka|Main Course|kozhisukka.jpg|Dry roasted chicken with coastal spices.",
    "Kappa Puzhukku & Chammanthi|Lunch|kappapuzhukku.jpg|Boiled tapioca served with coconut chutney.",
    "Kozhi Pidichathu|Main Course|kozhipidichathu.jpg|Chicken cooked thick and dry with roasted spices.",
    "Kozhi Pepper Fry|Main Course|pepperfry.jpg|Chicken tossed with crushed black pepper.",
    "Kozhi Kurumulaku Curry|Main Course|kurumulaku.jpg|Peppery chicken curry with thick gravy.",
    "Kappa Biriyani (Veg)|Main Course|vegkappabiryani.jpg|Spiced tapioca biriyani without meat.",
    "Kozhi Stew (White)|Main Course|whitekozhi.jpg|Creamy white chicken stew with coconut milk.",
    "Ragi Kali & Curry|Lunch|ragikali.jpg|Finger millet porridge served with spicy curry.",

    # ARABIC
    "Chicken Shawarma|Arabic|shawarma.jpg|Grilled marinated chicken wrapped in kuboos (Wheat/Gluten) with garlic sauce (Egg/Mayo).",
    "Beef Shawarma|Arabic|beefshawarma.jpg|Spiced roasted beef with tahini and salad wrapped in kuboos (Wheat/Gluten).",
    "Chicken Mandi|Arabic|mandi.jpg|Yemeni rice dish with tandoor cooked chicken and spices.",
    "Al Faham Chicken|Arabic|alfaham.jpg|Arabian grilled chicken marinated in mild spices.",
    "Kuboos (Pita Bread)|Arabic|kuboos.jpg|Soft Arabic flatbread made of wheat flour (Contains Gluten).",
    "Hummus|Arabic|hummus.jpg|Creamy dip made from chickpeas, tahini (Sesame), lemon, and garlic.",
    "Falafel|Arabic|falafel.jpg|Deep-fried patty made from ground chickpeas and herbs.",
    "Grilled Shish Tawook|Arabic|shishtawook.jpg|Skewered chicken cubes marinated in yogurt and spices (Contains Dairy).",

    # CHINESE
    "Chicken Fried Rice|Chinese|friedrice.jpg|Stir-fried rice with chicken, eggs, and veggies (Contains Egg, Soy).",
    "Schezwan Chicken Noodles|Chinese|schezwannoodles.jpg|Spicy noodles tossed in Schezwan sauce (Contains Gluten, Soy).",
    "Gobi Manchurian (Dry)|Chinese|gobimanchurian.jpg|Crispy cauliflower florets tossed in spicy soy-garlic sauce (Contains Gluten/Maida, Soy).",
    "Chilli Chicken (Dry)|Chinese|chillichicken.jpg|Battered chicken cubes tossed with green chilies and onions (Contains Gluten/Maida, Soy, Egg).",
    "Chicken Momos (Steamed)|Chinese|momos.jpg|Steamed dumplings filled with spiced minced chicken (Wrapper contains Gluten/Maida).",
    "Spring Rolls|Chinese|springrolls.jpg|Crispy fried rolls filled with shredded vegetables (Wrapper contains Gluten/Maida).",

    # INDIAN
    "Butter Naan|Indian|butternaan.jpg|Soft leavened bread brushed with butter (Contains Gluten/Maida, Dairy).",
    "Garlic Naan|Indian|garlicnaan.jpg|Naan bread topped with minced garlic and butter (Contains Gluten/Maida, Dairy).",
    "Tandoori Chicken (Half)|Indian|tandoori.jpg|Chicken marinated in yogurt and spices, roasted in a clay oven (Contains Dairy).",
    "Dal Makhani|Indian|dalmakhani.jpg|Creamy black lentils slow-cooked with butter and spices (Contains Dairy).",
    "Palak Paneer|Indian|palakpaneer.jpg|Cottage cheese cubes in a smooth spinach gravy (Contains Dairy).",
    "Chicken Tikka Masala|Indian|chickentikka.jpg|Roasted chicken chunks in a spiced curry sauce (Contains Dairy/Cream/Yogurt).",

    # FAST FOOD
    "Cheeseburger|Fast Food|cburger.jpg|Beef patty with cheese (Dairy), lettuce, tomato, and sauce in a bun (Gluten).",
    "French Fries (Medium)|Fast Food|fries.jpg|Deep-fried potato strips, salted.",
    "Pepperoni Pizza (Slice)|Fast Food|pizza.jpg|Slice of pizza topped with pepperoni and cheese (Contains Gluten, Dairy).",
    "Fried Chicken (2pc)|Fast Food|friedchicken.jpg|Crispy breaded fried chicken pieces (Contains Gluten/Maida, Egg).",
    "Club Sandwich|Fast Food|sandwich.jpg|Toasted sandwich with chicken, bacon, lettuce, and mayo (Contains Gluten, Egg).",

    # SEAFOOD
    "Karimeen Pollichathu|Seafood|karimeen.jpg|Pearl Spot fish grilled in banana leaf (Contains Fish).",
    "Mathi Fry (Sardine)|Seafood|mathifry.jpg|Deep fried sardines (High Omega-3, Contains Fish).",
    "Mathi Curry|Seafood|mathicurry.jpg|Sardines in spicy red chili gravy (Contains Fish).",
    "Ayala Fry (Mackerel)|Seafood|ayalafry.jpg|Fried mackerel (Contains Fish).",
    "Ayala Mulakittathu|Seafood|ayalacurry.jpg|Mackerel in spicy red curry with pot tamarind (Contains Fish).",
    "Netholi Peera|Seafood|netholi.jpg|Anchovies cooked with crushed coconut and raw mango (Contains Fish).",
    "Kallummakkaya Nirachathu|Snack|kallumakkaya.jpg|Mussels stuffed with spiced rice flour mixture (Contains Shellfish).",
    "Chemmeen Roast (Prawns)|Seafood|chemmeen.jpg|Spicy dry roasted prawns (Contains Shellfish).",
    "Njandu Roast (Crab)|Seafood|crab.jpg|Crab cooked in thick roasted coconut gravy (Contains Shellfish).",
    "Neymeen Curry (Seer Fish)|Seafood|neymeen.jpg|Seer fish slices in coconut milk gravy (Contains Fish).",
    "Koonthal Roast (Squid)|Seafood|koonthal.jpg|Squid rings roasted with pepper and curry leaves (Contains Shellfish).",
    "Kakkayirachi (Clams)|Seafood|kakka.jpg|Stir fried clams with plenty of coconut slices (Contains Shellfish).",
    "Meen Peera|Seafood|meenpeera.jpg|Shredded fish cooked with coconut, turmeric, and green chili (Contains Fish).",
    "Meen Mulakittathu (Earthen Pot)|Seafood|meenmulaku.jpg|Traditional fish curry cooked in clay pot (Contains Fish).",
    "Thenga Aracha Meen Curry|Seafood|thengameen.jpg|Fish curry with ground coconut paste (Contains Fish).",
    "Meen Varutharacha Curry|Seafood|meenvaruth.jpg|Fish curry made with roasted coconut paste (Contains Fish).",

    # MEAT & DINNER
    "Beef Ularthiyathu|Dinner|beefularthiyathu.jpg|Slow roasted beef chunks with coconut slices.",
    "Porotta & Beef Fry|Dinner|porotta.jpg|Flaky flatbread (Maida/Gluten) with roasted spicy beef.",
    "Beef Fry|Dinner|beeffry.jpg|Crispy dry fried beef.",
    "Nadan Kozhi Curry|Main Course|chickencurry.jpg|Country style chicken curry with roasted coconut.",
    "Chicken Stew|Breakfast|chickenstew.jpg|Mild chicken curry in coconut milk.",
    "Duck Roast (Tharavu)|Main Course|duckroast.jpg|Kuttanadan style spicy duck roast.",
    "Pork Fry (Angamaly)|Dinner|porkfry.jpg|Spicy pork cubes with green chili.",
    "Liver Fry|Side Dish|liverfry.jpg|Spicy stir-fried beef or chicken liver.",
    "Butter Chicken|Main Course|butterchicken.jpg|Chicken in a mildly spiced tomato cream sauce (Contains Dairy).",
    "Chilli Chicken|Main Course|chillichicken.jpg|Spicy Indo-Chinese stir fried chicken (Contains Soy, Gluten).",
    "Pathiri & Chicken Curry|Dinner|pathiri.jpg|Soft rice flatbread served with spicy Malabar chicken curry.",
    "Thalassery Pathiri|Dinner|thalasserypathiri.jpg|Malabar-style thin rice flatbread.",
    "Kozhi Kothu Porotta|Dinner|kothuporotta.jpg|Chopped porotta (Gluten) stir-fried with chicken and egg (Contains Egg).",

    # VEG SIDES
    "Avial|Side Dish|avial.jpg|Mixed vegetables in coconut and yogurt (Contains Dairy).",
    "Cabbage Thoran|Side Dish|thoran.jpg|Stir fried cabbage with grated coconut.",
    "Beans Mezhukkupuratti|Side Dish|beans.jpg|Long beans stir fried in coconut oil.",
    "Kovakka Fry|Side Dish|kovakka.jpg|Crispy fried ivy gourd slices.",
    "Pavakka Theeyal|Side Dish|pavakka.jpg|Bitter gourd in roasted coconut gravy.",
    "Kalan|Side Dish|kalan.jpg|Raw banana and yogurt curry, very thick (Contains Dairy).",
    "Olan|Side Dish|olan.jpg|Ash gourd and red beans in coconut milk (Mild).",
    "Erissery|Side Dish|erissery.jpg|Pumpkin and lentils with fried coconut topping.",
    "Koottu Curry|Side Dish|koottucurry.jpg|Mixed vegetable and black chickpea curry.",
    "Potato Stew|Side Dish|potatostew.jpg|Mild potato curry made with coconut milk.",
    "Moru Curry|Side Dish|moru.jpg|Seasoned buttermilk curry (Contains Dairy).",
    "Sambar|Side Dish|sambar.jpg|Lentil and vegetable stew with tamarind.",
    "Pulissery|Side Dish|pulissery.jpg|Yogurt and coconut curry with cucumber or mango (Contains Dairy).",
    "Rasam|Side Dish|rasam.jpg|Spicy tamarind and tomato soup.",
    "Theeyal (Ulli)|Side Dish|theeyal.jpg|Shallots cooked in roasted coconut gravy.",
    "Inji Curry|Side Dish|injicurry.jpg|Rich ginger curry served in Sadhyas.",
    "Vendakka Kichadi|Side Dish|kichadi.jpg|Fried okra in yogurt and coconut mustard base (Contains Dairy).",
    "Beetroot Pachadi|Side Dish|pachadi.jpg|Beetroot in yogurt and coconut paste (Contains Dairy).",
    "Pineapple Pachadi|Side Dish|pineapplepachadi.jpg|Sweet and sour pineapple curry (May contain yogurt/dairy).",
    "Paneer Butter Masala|Main Course|paneerbutter.jpg|Cottage cheese cubes in rich tomato gravy (Contains Dairy).",
    "Kappa Mezhukkupuratti|Side Dish|kappamezhukku.jpg|Stir-fried tapioca cubes with spices and curry leaves.",
    "Chena Mezhukkupuratti|Side Dish|chena.jpg|Yam stir-fried with coconut oil and spices.",
    "Koon Curry|Side Dish|kooncurry.jpg|Mushroom curry cooked with coconut milk and spices.",
    "Kozhi Thoran|Side Dish|kozhithoran.jpg|Dry stir-fried chicken with coconut and spices.",
    "Muringakka Thoran|Side Dish|muringakka.jpg|Drumstick vegetable stir-fry with coconut.",
    "Kakka Erissery|Side Dish|kakkaerissery.jpg|Clams cooked with pumpkin and coconut base (Contains Shellfish).",
    "Egg Roast Kerala Style|Side Dish|eggroast.jpg|Hard-boiled eggs roasted in onion-tomato masala (Contains Egg).",
    "Ulli Theeyal (Small Onion)|Side Dish|ullitheeyal.jpg|Pearl onions cooked in roasted coconut gravy.",
    "Raw Mango Pulissery|Side Dish|mangopulissery.jpg|Yogurt-based curry with raw mango (Contains Dairy).",
    "Kumbalanga Pulissery|Side Dish|ashgourd.jpg|Ash gourd yogurt curry with coconut (Contains Dairy).",
    "Kozhi Pachadi|Side Dish|kozhichutney.jpg|Chicken mixed in yogurt coconut base (Contains Dairy).",
    "Kumbalanga Thoran|Side Dish|kumbalanga.jpg|Ash gourd stir fry with coconut.",

    # SNACKS
    "Pazhampori|Snack|pazhampori.jpg|Ripe plantain fritters (Batter contains Maida/Gluten).",
    "Parippuvada|Snack|parippuvada.jpg|Crunchy lentil fritters.",
    "Uzhunnu Vada|Snack|uzhunnuvada.jpg|Donut-shaped savory fritter made of urad dal.",
    "Sukhiyan|Snack|sukhiyan.jpg|Green gram and jaggery balls deep fried (Batter contains Maida/Gluten).",
    "Bonda (Potato)|Snack|bonda.jpg|Spicy potato balls dipped in batter and fried (Batter contains Gram flour, may contain Maida/Gluten).",
    "Vettucake|Snack|vettucake.jpg|Dense, sweet fried tea cake (Contains Gluten/Maida, Egg).",
    "Achappam|Snack|achappam.jpg|Rose cookies made of rice flour (Contains Egg, Coconut milk).",
    "Kuzhalappam|Snack|kuzhalappam.jpg|Tube shaped crispy rice snack.",
    "Unnakaya|Snack|unnakaya.jpg|Mashed plantain stuffed with coconut and egg (Contains Egg).",
    "Chicken Cutlet|Snack|cutlet.jpg|Spiced minced chicken patty, breaded and fried (Contains Gluten/Breadcrumbs, Egg).",
    "Egg Puffs|Snack|eggpuffs.jpg|Bakery style flaky pastry with egg masala (Contains Gluten/Maida, Egg).",
    "Meat Rolls|Snack|meatrol.jpg|Bread roll stuffed with spicy meat filling (Contains Gluten/Bread, Egg).",
    "Bread Omelette|Snack|breadomelette.jpg|Spicy omelette sandwiched in bread (Contains Gluten, Egg).",
    "Diamond Cuts (Madakkusan)|Snack|diamondcuts.jpg|Sweet crispy fried flour biscuits (Contains Gluten/Maida).",
    "Avalose Podi|Snack|avalose.jpg|Roasted rice flour and coconut powder snack.",
    "Elayappam|Snack|elayappam.jpg|Rice parcels filled with coconut and jaggery, steamed in banana leaf.",
    "Ottada|Snack|ottada.jpg|Rice flatbread cooked in banana leaf on tawa.",
    "Vattayappam|Snack|vattayappam.jpg|Steamed fluffy rice cake with raisins (Fermented with yeast or toddy).",
    "Pessaha Appam|Snack|pessaha.jpg|Passover unleavened bread.",
    "Donut|Snack|donut.jpg|Sweet fried dough glaze (Contains Gluten/Maida, Egg, Dairy).",
    "Kozhukatta (Steamed)|Snack|kozhukatta.jpg|Steamed rice dumplings filled with coconut and jaggery.",
    "Ela Ada|Snack|elaada.jpg|Rice flour parcels stuffed with coconut and jaggery, steamed in banana leaf.",
    "Upperi (Raw Banana Fry)|Snack|upperi.jpg|Thin sliced raw banana fried until crispy.",
    "Kumbilappam (Rice)|Snack|kumbilrice.jpg|Steamed rice dumplings wrapped in bay leaves.",
    "Kappa Roast|Snack|kapparoast.jpg|Deep fried tapioca cubes with spices.",
    "Kappa Chips (Spicy)|Snack|kappachips.jpg|Deep fried tapioca chips with chili powder.",
    "Kozhi Thattukada Fry|Snack|thattukada.jpg|Street-style spicy fried chicken (Batter may contain Maida/Gluten).",

    # DESSERTS
    "Palada Payasam|Dessert|payasam.jpg|Pink milk dessert with rice flakes and sugar (Contains Dairy, Cashew/Nuts).",
    "Semiya Payasam|Dessert|semiya.jpg|Vermicelli pudding with milk, cardamom and cashews (Contains Gluten/Vermicelli, Dairy, Nuts).",
    "Ada Pradhaman|Dessert|adapradhaman.jpg|Traditional jaggery and coconut milk dessert with rice flakes (May contain Cashew/Nuts).",
    "Parippu Payasam|Dessert|parippu.jpg|Moong dal dessert with jaggery and coconut milk (May contain Cashew/Nuts).",
    "Wheat Payasam (Gothambu)|Dessert|gothambu_payasam.jpg|Broken wheat cooked in jaggery and coconut milk (Contains Gluten/Wheat, Nuts).",
    "Unniyappam|Snack|unniyappam.jpg|Fried rice and jaggery balls with banana.",
    "Neyyappam|Snack|neyyappam.jpg|Fried rice flour cake with ghee and jaggery (Contains Dairy/Ghee).",
    "Kozhikodan Halwa (Black)|Dessert|halwa.jpg|Dense sweet made of flour, coconut oil and jaggery (Contains Gluten/Maida, Nuts).",
    "Kozhikode Halwa (Red)|Dessert|redhalwa.jpg|Jelly-like sweet made of flour and sugar (Contains Gluten/Maida, Nuts).",
    "Mutta Mala|Dessert|muttamala.jpg|Egg yolk garlands cooked in sugar syrup (Contains Egg).",
    "Chattipathiri|Dessert|chattipathiri.jpg|Layered savory or sweet pastry (Contains Gluten/Maida, Egg, Nuts).",
    "Jalebi|Dessert|jalebi.jpg|Deep fried spiral sweet soaked in syrup (Contains Gluten/Maida).",
    "Gulab Jamun|Dessert|gulabjamun.jpg|Soft berry sized balls soaked in rose flavored sugar syrup (Contains Dairy/Khoya, Gluten/Maida).",
    "Rasgulla|Dessert|rasgulla.jpg|Ball shaped dumplings of chhena and semolina dough (Contains Dairy, Gluten).",
    "Mysore Pak|Dessert|mysorepak.jpg|Rich sweet made of ghee, sugar and gram flour (Contains Dairy/Ghee).",
    "Kesari Bath|Dessert|kesari.jpg|Saffron flavored semolina pudding (Contains Gluten/Semolina, Dairy/Ghee, Nuts).",
    "Rava Kesari (South Indian)|Dessert|ravakesari.jpg|Sweet semolina dessert with ghee and nuts (Contains Gluten, Dairy, Nuts).",
    "Paalada Pradhaman (Jaggery)|Dessert|paaladajaggery.jpg|Rich rice flake dessert sweetened with jaggery (Contains Dairy, Nuts).",

    # DRINKS
    "Kulukki Sarbath|Drink|kulukki.jpg|Spiced shaken lemonade with basil seeds and chili.",
    "Sambharam (Spiced Buttermilk)|Drink|sambharam.jpg|Refreshing buttermilk with ginger, chili and curry leaves (Contains Dairy).",
    "Avil Milk|Drink|avilmilk.jpg|Malappuram specialty drink with beaten rice, banana and nuts (Contains Dairy, Nuts).",
    "Nannari Sarbath|Drink|nannari.jpg|Cooling herbal root drink with lemon.",
    "Tender Coconut Shake|Drink|elaneer.jpg|Creamy shake made with tender coconut pulp (May contain Milk/Dairy).",
    "Sharjah Shake|Drink|sharjah.jpg|Thick banana and milk shake with boost/horlicks (Contains Dairy, Malt/Gluten).",
    "Tea|Drink|tea.jpg|Hot brewed tea with milk and sugar (Contains Dairy).",
    "Coffee|Drink|coffe.jpg|Hot brewed coffee (Contains Dairy).",
    "Lassi|Drink|lassi.jpg|Sweet yogurt based drink (Contains Dairy).",
    "Lemonade|Drink|lemonade.jpg|Fresh lemon juice with sugar and salt.",

    # JACKFRUIT
    "Chakka Puzhukku|Main Course|chakkapuzhukku.jpg|Mashed raw jackfruit with coconut and spices.",
    "Chakka Chips|Snack|chakkachips.jpg|Crispy fried ripe jackfruit chips.",
    "Chakka Varatti|Dessert|chakkavaratti.jpg|Jackfruit preserve/jam made with jaggery.",
    "Kumbilappam|Snack|kumbilappam.jpg|Jackfruit dumplings steamed in bay leaves.",
    "Chakkakuru Mezhukkupuratti|Side Dish|chakkakuru.jpg|Stir fried jackfruit seeds.",

    # CONDIMENTS
    "Chammanthi (Red)|Side Dish|chammanthi.jpg|Thick coconut chutney with red chili.",
    "Puli Inji|Side Dish|injipuli.jpg|Sweet, sour and spicy ginger curry.",
    "Naranga Achar|Side Dish|naranga.jpg|Traditional spicy lemon pickle.",
    "Kadumanga Achar|Side Dish|kadumanga.jpg|Tender mango pickle.",

    # CONTINENTAL
    "Grilled Chicken Salad|Salad|salad.jpg|Mixed greens, cherry tomatoes, and cucumber topped with herb-grilled chicken breast.",
    "Creamy Mushroom Pasta|Main Course|pasta.jpg|Penne pasta tossed in a rich white truffle cream sauce with sautéed mushrooms (Contains Gluten/Pasta, Dairy/Cream).",
    "Impossible Burger|Meat Alternative|burger.jpg|Plant-based patty served on a brioche bun with lettuce, tomato, and special sauce (Contains Gluten, Soy).",
    "Fish and Chips|Main Course|fishnchips.jpg|Battered cod fillets served with thick-cut fries and tartare sauce (Contains Gluten, Fish, Egg).",
    "Avocado Toast|Breakfast|avocado.jpg|Sourdough bread topped with smashed avocado, chili flakes, and olive oil (Contains Gluten).",
    "Greek Salad|Salad|greek.jpg|Fresh cucumbers, tomatoes, olives, and feta cheese dressed with olive oil and oregano (Contains Dairy/Feta).",
    "Vegetable Lasagna|Main Course|lasagna.jpg|Layers of pasta, marinara sauce, spinach, zucchini, and ricotta cheese (Contains Gluten, Dairy).",
    "Pancakes & Maple Syrup|Breakfast|pancakes.jpg|Fluffy buttermilk pancakes topped with butter and pure maple syrup (Contains Gluten, Dairy, Egg).",
    "Shepherd's Pie|Main Course|shepherds.jpg|Minced lamb cooked with vegetables topped with a creamy mashed potato crust (Contains Dairy/Butter).",
    "Grilled Salmon|Seafood|salmon.jpg|Fresh Atlantic salmon fillet grilled with lemon and dill, served with asparagus (Contains Fish).",

    # MILK & DAIRY
    "Cow's Milk|Dairy|cowmilk.jpg|Fresh whole milk (Contains Dairy).",
    "Goats's Milk|Dairy|goatmilk.jpg|Fresh whole goat milk (Contains Dairy).",
    "Skimmed Milk|Dairy|skimmedmilk.jpg|Low-fat cow's milk (Contains Dairy).",
    "Almond Milk|Dairy Alternative|almondmilk.jpg|Unsweetened plant-based milk made from almonds (Contains Nuts).",
    "Soy Milk|Dairy Alternative|soymilk.jpg|High protein plant-based milk (Contains Soy).",
    "Oat Milk|Dairy Alternative|oatmilk.jpg|Creamy plant-based milk, great for coffee.",
    "Coconut Milk|Dairy Alternative|coconutmilk.jpg|Rich and creamy milk from coconut flesh.",

    # BREADS
    "White Bread|Grain|whitebread.jpg|Soft refined flour bread (Contains Gluten).",
    "Whole Wheat Bread|Grain|wheatbread.jpg|Fiber-rich brown bread (Contains Gluten).",
    "Multigrain Bread|Grain|multigrain.jpg|Bread with seeds and multiple grains (Contains Gluten).",
    "Sourdough Bread|Grain|sourdough.jpg|Fermented tangy bread (Contains Gluten).",
    "Gluten-Free Bread|Grain|glutenfreebread.jpg|Bread made without wheat, barley, or rye.",

    # SUGAR & SWEETENERS
    "White Sugar|Sweetener|sugar.jpg|Refined sucrose granules.",
    "Brown Sugar|Sweetener|brownsugar.jpg|Sugar with molasses.",
    "Honey|Sweetener|honey.jpg|Natural bee sweetener.",
    "Jaggery|Sweetener|jaggery.jpg|Unrefined cane sugar block.",
    "Stevia|Sweetener|stevia.jpg|Zero-calorie natural sweetener.",
    "Maple Syrup|Sweetener|maplesyrup.jpg|Sap from sugar maple trees.",

    # VEGAN PROTEIN
    "Tofu|Plant Protein|tofu.jpg|Soybean curd, versatile protein source (Contains Soy).",
    "Tempeh|Plant Protein|tempeh.jpg|Fermented soybean cake with nutty flavor (Contains Soy).",
    "Vegan Cheese|Dairy Alternative|vegancheese.jpg|Plant-based cheese alternative.",
    "Nutritional Yeast|Plant Protein|nutritionalyeast.jpg|Cheesy tasting deactivated yeast flakes.",
    "Seitan (Wheat Meat)|Plant Protein|seitan.jpg|High protein wheat gluten (Contains Gluten).",
]

DIRECT_SWAPS = {
    "White Sugar": "Stevia",
    "Brown Sugar": "Jaggery",
    "Cow's Milk": "Almond Milk",
    "White Bread": "Whole Wheat Bread",
    "Fried Chicken (2pc)": "Grilled Shish Tawook",
    "Chicken Shawarma": "Al Faham Chicken",
    "Porotta & Beef Fry": "Chapati",
    "Pazhampori": "Steamed Banana (Nenthrapazham)",
    "Ghee Roast Dosa": "Idli",
    "Creamy Mushroom Pasta": "Vegetable Lasagna",
    "French Fries (Medium)": "Baked Potato Wedges"
}


def generate_smart_data(category, name, desc):
    """Fallback logic if not in Precision DB"""
    name_lower = name.lower()
    cat_lower = category.lower()

    # Check PRECISION DB first
    if name in REAL_NUTRITION_DB:
        data = REAL_NUTRITION_DB[name]

        # --- ECO SCORE LOGIC ---
        eco_score = 80
        if "Beef" in name or "Pork" in name or "Meat" in name or "Burger" in name or "Mandi" in name:
            eco_score = 30
        elif "Chicken" in name or "Duck" in name or "Shawarma" in name:
            eco_score = 60
        elif "Fish" in name or "Seafood" in category:
            eco_score = 80
        elif "Veg" in category or "Side Dish" in category or "Plant" in category or "Salad" in category:
            eco_score = 95

        if "Fast Food" in category:
            eco_score -= 10

        # --- NUTRI SCORE LOGIC ---
        nutri_score = 80
        if data["fat"] > 20: nutri_score -= 10
        if data["sugar"] > 15: nutri_score -= 15
        if data["sodium"] > 500: nutri_score -= 10
        if data["protein"] > 15: nutri_score += 10
        if data["fiber"] > 5: nutri_score += 5

        if nutri_score > 100: nutri_score = 100

        return data, {"carbon": 1.5, "water": 200, "land": 1.5, "score": eco_score}, [], nutri_score

    # ... Fallback Smart Logic
    stats = {
        "calories": random.randint(150, 300),
        "protein": random.randint(2, 10),
        "fat": random.randint(5, 15),
        "carbohydrates": random.randint(20, 50),
        "fiber": random.randint(1, 4),
        "sugar": random.randint(1, 5),
        "sodium": random.randint(200, 400)
    }
    eco = {"carbon": 1.0, "water": 100, "land": 1.0, "score": 80}
    allergens = []
    nutri_score = 80

    if "arabic" in cat_lower or "shawarma" in name_lower:
        stats.update({"calories": 500, "protein": 25, "fat": 25, "carbohydrates": 30})
        eco["score"] = 55
        nutri_score = 65

    elif "chinese" in cat_lower or "fried rice" in name_lower:
        stats.update({"calories": 550, "protein": 15, "fat": 20, "carbohydrates": 65, "sodium": 800})
        eco["score"] = 60
        nutri_score = 50
        allergens.append("Soy")

    elif "fast food" in cat_lower or "burger" in name_lower:
        stats.update({"calories": 600, "protein": 20, "fat": 30, "carbohydrates": 50, "sodium": 900})
        eco["score"] = 40
        nutri_score = 40

    return stats, eco, allergens, nutri_score


def seed_db():
    db = SessionLocal()
    try:
        # 👇 IMPORTANT: Wipe tables ONCE to fix the structure
        print("Dropping old tables to fix schema...")
        Base.metadata.drop_all(bind=engine)
        print("Creating new tables...")
        Base.metadata.create_all(bind=engine)

        # Now insert fresh data
        print("Inserting foods...")
        final_list = []

        for raw in raw_native_list:
            parts = raw.split("|")
            if len(parts) < 4: continue
            name, cat, img, desc = parts[0], parts[1], parts[2], parts[3]
            stats, eco, allergens, n_score = generate_smart_data(cat, name, desc)

            # --- IMPROVED SAFETY ANALYSIS LOGIC ---
            text_search = (name + " " + desc).lower()

            # 1. DAIRY CHECK (Added: yogurt, buttermilk, khoya, malai, feta, ghee)
            if "Dairy" not in allergens and any(x in text_search for x in
                                                ["milk", "cheese", "butter", "ghee", "curd", "cream", "paneer",
                                                 "lassi", "yogurt", "buttermilk", "khoya", "malai", "shake", "feta"]):
                allergens.append("Dairy")

            # 2. NUT CHECK (Added: pistachio, walnut, peanut)
            if "Nuts" not in allergens and any(x in text_search for x in
                                               ["nut", "cashew", "almond", "pistachio", "walnut", "peanut", "praline"]):
                allergens.append("Nuts")

            # 3. GLUTEN CHECK (Added: semolina, rava, sooji, pasta, noodles, vermicelli)
            if "Gluten" not in allergens and any(x in text_search for x in
                                                 ["wheat", "bread", "maida", "porotta", "roti", "naan", "bhatura",
                                                  "cake", "burger", "semolina", "rava", "sooji", "pasta", "noodles",
                                                  "biscuit", "kuboos", "vermicelli", "malt", "seitan", "brioche",
                                                  "pizza"]):
                allergens.append("Gluten")

            # 4. EGG CHECK (Added: batter, meringue, scramble, mayonnaise)
            if "Eggs" not in allergens and any(x in text_search for x in
                                               ["egg", "omelette", "mayo", "cake", "batter", "scramble", "meringue",
                                                "pancake", "mayonnaise"]):
                allergens.append("Eggs")

            # 5. FISH/SHELLFISH CHECK (Added: sardine, mackerel, tuna, salmon, clam, mussel)
            if "Fish" not in allergens and any(x in text_search for x in
                                               ["fish", "prawn", "crab", "squid", "mathi", "ayala", "sardine",
                                                "mackerel", "tuna", "salmon", "seafood", "clam", "mussel", "oyster"]):
                allergens.append("Fish")

            # 6. SOY CHECK (New Category)
            if "Soy" not in allergens and any(x in text_search for x in ["soy", "tofu", "tempeh", "edamame"]):
                allergens.append("Soy")

            final_list.append({
                "name": name, "category": cat, "image": f"/assets/images/{img}", "desc": desc,
                "score": n_score, "eco": eco["score"], "stats": stats, "eco_data": eco, "allergens": allergens
            })

        for item in final_list:
            food = Food(
                name=item["name"],
                brand="Kerala Native" if "Alternative" not in item["category"] and "Fast Food" not in item[
                    "category"] and "Chinese" not in item["category"] else "Restaurant/Global",
                category=item["category"],
                image=item["image"],
                description=item["desc"],
                serving_size="1 Portion",
                price_range="$" if "Street" in item["category"] else "$$",
                nutrition_score=item["score"],
                sustainability_score=item["eco"]
            )
            food.nutrition = Nutrition(**item["stats"])
            food.sustainability = Sustainability(
                carbon_footprint=item["eco_data"]["carbon"],
                water_usage=item["eco_data"]["water"],
                land_use=item["eco_data"]["land"],
                sustainability_score=item["eco"]
            )
            food.allergens = Allergen(
                dairy="Dairy" in item["allergens"], nuts="Nuts" in item["allergens"],
                gluten="Gluten" in item["allergens"], soy="Soy" in item["allergens"],
                eggs="Eggs" in item["allergens"], shellfish="Fish" in item["allergens"]
            )
            db.add(food)

        db.commit()
        print(f"Pass 1 Complete: {len(final_list)} items added.")

        # --- PASS 2: SWAP LOGIC ---
        print("Recalculating Smart Swaps...")
        all_foods = db.query(Food).all()
        for food in all_foods:
            best_swap = None
            if food.name in DIRECT_SWAPS:
                target_name = DIRECT_SWAPS[food.name]
                best_swap = next((f for f in all_foods if f.name == target_name), None)

            if not best_swap:
                candidates = []
                for candidate in all_foods:
                    if candidate.id == food.id: continue
                    score = 0
                    if food.category == candidate.category:
                        score += 30
                    elif food.category in ["Breakfast", "Dinner"] and candidate.category in ["Breakfast", "Dinner"]:
                        score += 20
                    else:
                        continue

                    if candidate.nutrition_score > food.nutrition_score:
                        score += (candidate.nutrition_score - food.nutrition_score)
                    else:
                        continue

                    if "chicken" in food.name.lower() and "chicken" in candidate.name.lower(): score += 10
                    desc_check = (candidate.description + candidate.name).lower()
                    if "steamed" in desc_check or "grilled" in desc_check: score += 15
                    if "fried" in desc_check: score -= 10
                    candidates.append((score, candidate))

                if candidates:
                    candidates.sort(key=lambda x: x[0], reverse=True)
                    best_swap = candidates[0][1]

            if best_swap:
                food.healthy_alternative_id = best_swap.id

        db.commit()
        print("Smart Swaps Updated.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()