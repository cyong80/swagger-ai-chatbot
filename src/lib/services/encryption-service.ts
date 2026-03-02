/**
 * API 키 암호화/복호화 서비스 (DIP: salt 주입 가능)
 */
import CryptoJS from "crypto-js";
import type { IEncryptionService } from "../types";

function createEncryptionService(salt: string): IEncryptionService {
  return {
    encrypt(text: string) {
      return CryptoJS.AES.encrypt(text, salt).toString();
    },
    decrypt(cipher: string) {
      try {
        const bytes = CryptoJS.AES.decrypt(cipher, salt);
        return bytes.toString(CryptoJS.enc.Utf8);
      } catch {
        return "";
      }
    },
  };
}

// 기본 구현: chrome.runtime.id 사용
export const DefaultEncryptionService: IEncryptionService =
  typeof chrome !== "undefined" && chrome.runtime?.id
    ? createEncryptionService(chrome.runtime.id)
    : createEncryptionService("default-salt-for-tests");
