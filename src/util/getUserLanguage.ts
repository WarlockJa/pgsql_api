const LANGUAGES = ["en", "ru"];
const DEFAULT_LANG = "en";

const getUserLanguage = (language: string) => {
  return LANGUAGES.findIndex((lng) => lng === language) === -1
    ? DEFAULT_LANG
    : language;
};

export default getUserLanguage;
