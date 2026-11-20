import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CURATED_AVATARS,
  getFallbackGradientTheme,
  getGradientThemeByToken,
  getInitials,
  getSkillChipClasses,
  getSkillTone,
  GRADIENT_AVATAR_THEMES,
  isImagePhotoUrl,
} from './avatar';

test('GRADIENT_AVATAR_THEMES provides 6 themes and CURATED_AVATARS provides 12 presets', () => {
  assert.equal(GRADIENT_AVATAR_THEMES.length, 6);
  assert.equal(CURATED_AVATARS.length, 12);
});

test('getGradientThemeByToken resolves valid tokens and ignores image URLs', () => {
  const theme = getGradientThemeByToken('gradient:sunset-coral');
  assert.ok(theme);
  assert.equal(theme.id, 'sunset-coral');
  assert.equal(getGradientThemeByToken('https://example.com/a.png'), null);
});

test('isImagePhotoUrl validates http(s) and base64 image data URLs only', () => {
  assert.equal(isImagePhotoUrl('https://api.dicebear.com/9.x/micah/svg?seed=Test'), true);
  assert.equal(isImagePhotoUrl('data:image/jpeg;base64,abc123'), true);
  assert.equal(isImagePhotoUrl('gradient:indigo-violet'), false);
  assert.equal(isImagePhotoUrl(''), false);
});

test('getInitials and getFallbackGradientTheme produce deterministic outputs', () => {
  assert.equal(getInitials('Harshita Chhetri'), 'HC');
  assert.equal(getInitials('Aarav'), 'AA');
  const first = getFallbackGradientTheme('Ananya Verma');
  const second = getFallbackGradientTheme('Ananya Verma');
  assert.equal(first.id, second.id);
});

test('getSkillTone and getSkillChipClasses map skills to Indigo, Emerald, or Amber', () => {
  assert.equal(getSkillTone('Python / Coding'), 'tech');
  assert.equal(getSkillTone('Financial Modeling'), 'finance');
  assert.equal(getSkillTone('PPT Pitch Design'), 'design');
  assert.match(getSkillChipClasses('React / Frontend'), /indigo/);
  assert.match(getSkillChipClasses('Market Research'), /emerald/);
  assert.match(getSkillChipClasses('Public Speaking'), /amber/);
});
