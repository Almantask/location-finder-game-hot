export const i18n = {
  en: {
    // Start Menu
    "title_sub": "Thermal Location Finder",
    "how_to_play": "How to Play",
    "rule_1": "You will be given a target city to locate on a <strong>blind map</strong> (its name is hidden at first!).",
    "rule_2": "Click the map to place your guess marker, then click <strong>Confirm Guess</strong>.",
    "rule_3": "You have <strong>5 attempts</strong> per location. Correct guess range is <strong>1000 km</strong>.",
    "rule_4": "Every <strong>15 seconds</strong>, a new hint unlocks (first hint is available immediately):",
    "rule_4_1": "Landmarks & Culture Clue (At Start)",
    "rule_4_2": "Geography & Nature Clue (At 15s)",
    "rule_4_3": "History & Trivia Clue (At 30s)",
    "rule_4_4": "<strong>Thermal Mouse Pointer</strong> (At 45s)",
    "rule_5": "Score depends on distance accuracy and response speed. Good luck!",
    "rounds_per_session": "Rounds per Session",
    "round_short": "5 Locations (Short)",
    "round_standard": "10 Locations (Standard)",
    "round_marathon": "20 Locations (Marathon)",
    "start_mission": "START MISSION",
    "view_high_scores": "View High Scores",
    
    // High Scores Modal
    "global_leaderboard": "Global Leaderboard",
    "rank": "Rank",
    "player": "Player",
    "score": "Score",
    "accuracy": "Accuracy",
    "date": "Date",
    "no_scores": "No high scores cached yet. Start playing to rank first!",
    
    // HUD
    "hud_location": "LOCATION",
    "hud_time_elapsed": "TIME ELAPSED",
    "hud_multiplier": "MULTIPLIER",
    "hud_total_score": "TOTAL SCORE",
    "hud_mute_tooltip": "Toggle Sound",
    "hud_quit_tooltip": "Quit Game",
    
    // Gameplay
    "find_target": "FIND TARGET",
    "target_default": "Target Location",
    "target_prefix": "Target",
    "intel_brief": "Intelligence Brief",
    "hint_1_title": "HINT 1",
    "hint_1_sub": "At Start: Landmarks & Culture",
    "hint_2_title": "HINT 2",
    "hint_2_sub": "At 15s: Geography & Nature",
    "hint_3_title": "HINT 3",
    "hint_3_sub": "At 30s: History & Trivia",
    "hint_4_title": "HINT 4",
    "hint_4_sub": "At 45s: Thermal Cursor",
    "hint_4_text": "Thermal heat tracking active. Move mouse to track proximity.",
    "thermal_boiling": "Boiling Hot",
    "thermal_hot": "Hot",
    "thermal_warm": "Warm",
    "thermal_cool": "Cool",
    "thermal_cold": "Cold",
    "thermal_freezing": "Freezing Cold",
    "attempts": "ATTEMPTS",
    "place_marker_msg": "Place marker on the map",
    "click_map_msg": "Click on the map to place your guess",
    "confirm_guess": "CONFIRM GUESS",
    "guess_placed_prefix": "Guess placed",
    "too_far_msg": "away. Too far! Try again.",
    
    // Round Summary
    "round_complete": "Round Complete",
    "points_awarded": "Points Awarded",
    "loc_secured": "Location Secured",
    "loc_secured_sub": "Target identified within threshold",
    "mission_compromised": "Mission Compromised",
    "mission_compromised_sub": "Target location lost (out of attempts)",
    "dist_from_target": "DISTANCE FROM TARGET",
    "accuracy_score_label": "Accuracy Score",
    "time_bonus_label": "Time Bonus",
    "total_round_pts": "Total Round Points",
    "next_location": "NEXT LOCATION",
    "view_final_results": "VIEW FINAL RESULTS",
    
    // Game Over
    "mission_complete": "MISSION COMPLETE",
    "game_over_sub": "Global Intelligence Briefing Over",
    "final_score": "FINAL SCORE",
    "avg_dist": "Avg Distance",
    "perfect_guesses": "Perfect Guesses",
    "time_taken": "Time Taken",
    "record_high_score": "Record High Score",
    "qualified_msg": "You qualified for the leaderboard! Enter your name below:",
    "enter_agent_name": "Enter Agent Name",
    "record_btn": "RECORD",
    "play_again": "PLAY AGAIN",
    "main_menu": "Main Menu",
    
    // Prompts / Dynamic Alert text
    "abort_confirm": "Are you sure you want to abort the current game session? Your progress will be lost.",
    "anonymous_agent": "Anonymous Agent",
    
    // Continents
    "Europe": "Europe",
    "Asia": "Asia",
    "Africa": "Africa",
    "Oceania": "Oceania",
    "South America": "South America",
    "North America": "North America",

    // Smart Tips
    "tip_bullseye": "🎯 <strong>Bullseye!</strong> Incredible spatial accuracy! You were spot on target (${distanceKm} km).",
    "tip_superb": "⚡ <strong>Superb!</strong> Just a short distance off (${distanceKm} km). You navigated the map with expertise.",
    "tip_confirmed": "👍 <strong>Confirmed.</strong> Good enough to secure target data. Try to lock it in faster next round.",
    "tip_failure": "⚠️ <strong>Intelligence Failure.</strong> The target city was <strong>${targetName}</strong>, located in the continent of <strong>${continent}</strong>."
  },
  lt: {
    // Start Menu
    "title_sub": "Šiluminis vietovės ieškiklis",
    "how_to_play": "Kaip žaisti",
    "rule_1": "Jums bus pateiktas tikslinis miestas, kurį reikės rasti <strong>aklajame žemėlapyje</strong> (jo pavadinimas iš pradžių paslėptas!).",
    "rule_2": "Spustelėkite žemėlapį, kad pažymėtumėte savo spėjimą, tada spauskite <strong>Patvirtinti spėjimą</strong>.",
    "rule_3": "Kiekvienai vietovei turite <strong>5 bandymus</strong>. Teisingas spėjimo diapazonas yra <strong>1000 km</strong>.",
    "rule_4": "Kas <strong>15 sekundžių</strong> atsirakina nauja užuomina (pirmoji užuomina prieinama iškart):",
    "rule_4_1": "Žymios vietos ir kultūros užuomina (Pradžioje)",
    "rule_4_2": "Geografijos ir gamtos užuomina (Po 15s)",
    "rule_4_3": "Istorijos ir įdomybių užuomina (Po 30s)",
    "rule_4_4": "<strong>Šiluminis pelės žymeklis</strong> (Po 45s)",
    "rule_5": "Taškai priklauso nuo atstumo tikslumo ir atsakymo greičio. Sėkmės!",
    "rounds_per_session": "Raundų skaičius",
    "round_short": "5 vietovės (Trumpas)",
    "round_standard": "10 vietovių (Standartinis)",
    "round_marathon": "20 vietovių (Maratonas)",
    "start_mission": "PRADĖTI MISIJĄ",
    "view_high_scores": "Peržiūrėti rezultatus",
    
    // High Scores Modal
    "global_leaderboard": "Pasaulinė lyderių lentelė",
    "rank": "Vieta",
    "player": "Žaidėjas",
    "score": "Taškai",
    "accuracy": "Tikslumas",
    "date": "Data",
    "no_scores": "Rezultatų dar nėra. Pradėkite žaisti, kad taptumėte pirmas!",
    
    // HUD
    "hud_location": "VIETA",
    "hud_time_elapsed": "PRAĖJO LAIKO",
    "hud_multiplier": "DAUGIKLIS",
    "hud_total_score": "TAŠKAI",
    "hud_mute_tooltip": "Įjungti / išjungti garsą",
    "hud_quit_tooltip": "Baigti žaidimą",
    
    // Gameplay
    "find_target": "RASTI TIKSLĄ",
    "target_default": "Tikslinė vieta",
    "target_prefix": "Tikslas",
    "intel_brief": "Žvalgybos suvestinė",
    "hint_1_title": "1 UŽUOMINA",
    "hint_1_sub": "Pradžioje: žymios vietos ir kultūra",
    "hint_2_title": "2 UŽUOMINA",
    "hint_2_sub": "Po 15s: geografija ir gamta",
    "hint_3_title": "3 UŽUOMINA",
    "hint_3_sub": "Po 30s: istorija ir įdomybės",
    "hint_4_title": "4 UŽUOMINA",
    "hint_4_sub": "Po 45s: šiluminis žymeklis",
    "hint_4_text": "Šiluminis sekimas aktyvus. Judinkite pelę, kad matytumėte artumą.",
    "thermal_boiling": "Degina",
    "thermal_hot": "Karšta",
    "thermal_warm": "Šilta",
    "thermal_cool": "Vėsu",
    "thermal_cold": "Šalta",
    "thermal_freezing": "Ledinė",
    "attempts": "BANDYMAI",
    "place_marker_msg": "Pažymėkite vietą žemėlapyje",
    "click_map_msg": "Spustelėkite žemėlapį, kad pateiktumėte spėjimą",
    "confirm_guess": "PATVIRTINTI SPĖJIMĄ",
    "guess_placed_prefix": "Spėjimas atliktas",
    "too_far_msg": "atstumu. Per toli! Bandykite dar kartą.",
    
    // Round Summary
    "round_complete": "Raundas baigtas",
    "points_awarded": "Skirti taškai",
    "loc_secured": "Vieta nustatyta",
    "loc_secured_sub": "Tikslas nustatytas leistiname diapazone",
    "mission_compromised": "Misija nepavyko",
    "mission_compromised_sub": "Tikslinė vieta prarasta (baigėsi bandymai)",
    "dist_from_target": "ATSTUMAS IKI TIKSLO",
    "accuracy_score_label": "Tikslumo taškai",
    "time_bonus_label": "Laiko premija",
    "total_round_pts": "Iš viso raundo taškų",
    "next_location": "KITA VIETA",
    "view_final_results": "PERŽIŪRĖTI REZULTATUS",
    
    // Game Over
    "mission_complete": "MISIJA BAIGTA",
    "game_over_sub": "Pasaulinės žvalgybos suvestinė baigta",
    "final_score": "GALUTINIS REZULTATAS",
    "avg_dist": "Vid. atstumas",
    "perfect_guesses": "Tikslūs spėjimai",
    "time_taken": "Sugaištas laikas",
    "record_high_score": "Įrašyti geriausią rezultatą",
    "qualified_msg": "Patekote į lyderių lentelę! Įveskite savo vardą žemiau:",
    "enter_agent_name": "Įveskite agento vardą",
    "record_btn": "ĮRAŠYTI",
    "play_again": "ŽAISTI VĖL",
    "main_menu": "Pagrindinis meniu",
    
    // Prompts / Dynamic Alert text
    "abort_confirm": "Ar tikrai norite nutraukti dabartinį žaidimą? Jūsų progresas bus prarastas.",
    "anonymous_agent": "Anoniminis agentas",
    
    // Continents
    "Europe": "Europa",
    "Asia": "Azija",
    "Africa": "Afrika",
    "Oceania": "Okeanija",
    "South America": "Pietų Amerika",
    "North America": "Šiaurės Amerika",

    // Smart Tips
    "tip_bullseye": "🎯 <strong>Tiesiai į dešimtuką!</strong> Neįtikėtinas erdvės tikslumas! Pataikėte tiesiai į tikslą (${distanceKm} km).",
    "tip_superb": "⚡ <strong>Puikiai!</strong> Tik nedidelis atstumas iki tikslo (${distanceKm} km). Meistriškai valdote žemėlapį.",
    "tip_confirmed": "👍 <strong>Patvirtinta.</strong> Pakankamai arti, kad gautume tikslo duomenis. Kitame raunde stenkitės atlikti greičiau.",
    "tip_failure": "⚠️ <strong>Žvalgybos klaida.</strong> Tikslinis miestas buvo <strong>${targetName}</strong>, esantis <strong>${continent}</strong> žemyne."
  }
};

const translationCache = {};

export function t(key, lang = 'en') {
  return i18n[lang][key] || i18n['en'][key] || key;
}

export async function translateText(text, targetLang) {
  if (!text) return '';
  if (targetLang === 'en') return text;
  
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation API failed');
    const data = await res.json();
    if (data && data[0]) {
      const translated = data[0].map(item => item[0]).join('');
      translationCache[cacheKey] = translated;
      return translated;
    }
  } catch (err) {
    console.warn('Translation failed, falling back to original:', err);
  }
  return text;
}

export async function getTranslatedTarget(target, lang) {
  if (lang === 'en') {
    return { ...target };
  }
  
  try {
    const [name, continent, hint1, hint2, hint3] = await Promise.all([
      translateText(target.name, lang),
      Promise.resolve(i18n[lang][target.continent] || translateText(target.continent, lang)),
      translateText(target.hint1, lang),
      translateText(target.hint2, lang),
      translateText(target.hint3, lang)
    ]);
    
    return {
      id: target.id,
      name,
      coords: target.coords,
      continent,
      hint1,
      hint2,
      hint3
    };
  } catch (err) {
    console.error('Translation error, using fallback:', err);
    return { ...target };
  }
}
