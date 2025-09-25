/**
 * MIGRATED: Все функции перенесены в новую архитектуру
 *
 * ✅ Транспортные функции → services/transport.ts
 * ✅ Создание пейлоадов → services/levelPayloads/
 * ✅ Композабл для загрузки → composables/levels/useLevelPayloads.ts
 *
 * Этот файл оставлен пустым для совместимости.
 * Старые интерфейсы доступны в uploader_legacy.ts
 */

// Экспортируем типы для обратной совместимости
export type { Answer } from './uploader_legacy'