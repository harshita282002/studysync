import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchScore,
  getDeadlineInfo,
  getProjectSkillCoverage,
  validateMatchMessage,
  validateProfileInput,
  validateProjectInput,
} from './matching';
import type { SkillTag } from '../types/studysync';

test('calculateMatchScore awards higher score for complementary skills the user lacks', () => {
  const userSkills: SkillTag[] = [
    { name: 'Financial Modeling', proficiency: 'Expert' },
    { name: 'Case Strategy', proficiency: 'Intermediate' },
  ];

  const complementaryPeer: SkillTag[] = [
    { name: 'PPT Pitch Design', proficiency: 'Expert' },
    { name: 'Python / Coding', proficiency: 'Expert' },
    { name: 'Public Speaking', proficiency: 'Intermediate' },
  ];

  const identicalPeer: SkillTag[] = [
    { name: 'Financial Modeling', proficiency: 'Expert' },
    { name: 'Case Strategy', proficiency: 'Intermediate' },
  ];

  const compResult = calculateMatchScore(userSkills, complementaryPeer, 'Available Now', 4.9, true);
  const sameResult = calculateMatchScore(userSkills, identicalPeer, 'Available Now', 4.9, false);

  assert.ok(compResult.score > sameResult.score, `Expected ${compResult.score} > ${sameResult.score}`);
  assert.deepEqual(compResult.complementarySkills, ['PPT Pitch Design', 'Python / Coding', 'Public Speaking']);
  assert.deepEqual(sameResult.sharedSkills, ['Financial Modeling', 'Case Strategy']);
  assert.ok(compResult.score <= 99 && sameResult.score >= 15);
});

test('getProjectSkillCoverage accurately identifies matched and missing skills', () => {
  const userSkills: SkillTag[] = [
    { name: 'Financial Modeling', proficiency: 'Expert' },
    { name: 'Market Research', proficiency: 'Intermediate' },
  ];
  const required = ['Financial Modeling', 'PPT Pitch Design', 'Data Analytics'];
  const coverage = getProjectSkillCoverage(userSkills, required);

  assert.deepEqual(coverage.matched, ['Financial Modeling']);
  assert.deepEqual(coverage.missing, ['PPT Pitch Design', 'Data Analytics']);
  assert.ok(Math.abs(coverage.matchRatio - 1 / 3) < 0.001);
});

test('getDeadlineInfo classifies urgent, soon, normal, and overdue dates', () => {
  const ref = new Date('2026-11-20T10:00:00Z');
  assert.equal(getDeadlineInfo('2026-11-20', ref).urgency, 'urgent');
  assert.equal(getDeadlineInfo('2026-11-22', ref).urgency, 'urgent');
  assert.equal(getDeadlineInfo('2026-11-25', ref).urgency, 'soon');
  assert.equal(getDeadlineInfo('2026-12-10', ref).urgency, 'normal');
  assert.equal(getDeadlineInfo('2026-11-18', ref).urgency, 'overdue');
});

test('form validation helpers enforce blueprint constraints', () => {
  assert.notEqual(
    validateProfileInput({
      name: 'A',
      program: '1st Year MBA',
      campusCluster: 'DGU Campus',
      bio: '',
      skills: [{ name: 'Financial Modeling', proficiency: 'Expert' }],
    }),
    null
  );

  assert.notEqual(
    validateProfileInput({
      name: 'Harshita Chhetri',
      program: '1st Year MBA',
      campusCluster: 'DGU Campus',
      bio: 'MBA student',
      skills: Array.from({ length: 7 }, (_, i) => ({
        name: `Skill ${i}`,
        proficiency: 'Intermediate' as const,
      })),
    }),
    null
  );

  assert.equal(
    validateProfileInput({
      name: 'Harshita Chhetri',
      program: '1st Year MBA',
      campusCluster: 'DGU Campus',
      bio: 'MBA student focused on strategy & finance.',
      skills: [{ name: 'Financial Modeling', proficiency: 'Expert' }],
    }),
    null
  );

  assert.notEqual(
    validateProjectInput({
      title: 'Hi',
      category: 'Case Competition',
      description: 'Valid description here',
      requiredSkills: ['Financial Modeling'],
      deadline: '2026-11-28',
      teamSizeNeeded: 4,
    }),
    null
  );

  assert.notEqual(validateMatchMessage('Hi'), null);
  assert.equal(validateMatchMessage('Would love to team up for the DGU Case Comp!'), null);
});
