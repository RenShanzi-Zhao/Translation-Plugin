export type TranslateItem = {
  id: string;
  text: string;
};

export type TranslationResult = {
  id: string;
  translatedText: string;
};

export type BatchTranslateRequest = {
  items: TranslateItem[];
  sourceLang: string;
  targetLang: string;
};

export type BatchTranslateResponse = {
  translations: TranslationResult[];
};

export type TranslateError = {
  code: string;
  message: string;
};

export type PopupMessage =
  | { type: "START_TRANSLATE"; targetLang: string }
  | { type: "REMOVE_TRANSLATION" };

export type ContentToBgMessage =
  | { type: "TRANSLATE_BATCH"; items: TranslateItem[]; sourceLang: string; targetLang: string }
  | { type: "PING" };

export type BgToContentMessage =
  | { type: "TRANSLATE_RESULT"; translations: TranslationResult[] }
  | { type: "TRANSLATE_ERROR"; error: TranslateError };
