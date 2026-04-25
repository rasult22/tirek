import { test } from 'node:test';
import assert from 'node:assert/strict';

import { normalizeNotificationType } from './notification-type.js';

test('should_pass_through_canonical_crisis_red', () => {
  assert.equal(normalizeNotificationType('crisis_red'), 'crisis_red');
});

test('should_pass_through_canonical_concern_yellow', () => {
  assert.equal(normalizeNotificationType('concern_yellow'), 'concern_yellow');
});

test('should_pass_through_canonical_info_and_chat', () => {
  assert.equal(normalizeNotificationType('info'), 'info');
  assert.equal(normalizeNotificationType('chat'), 'chat');
});

test('should_map_legacy_crisis_to_crisis_red', () => {
  assert.equal(normalizeNotificationType('crisis'), 'crisis_red');
});

test('should_map_legacy_sos_alert_to_crisis_red', () => {
  assert.equal(normalizeNotificationType('sos_alert'), 'crisis_red');
});

test('should_map_legacy_concern_detected_to_concern_yellow', () => {
  assert.equal(normalizeNotificationType('concern_detected'), 'concern_yellow');
});

test('should_map_legacy_appointment_to_info', () => {
  assert.equal(normalizeNotificationType('appointment'), 'info');
});

test('should_map_legacy_direct_message_to_chat', () => {
  assert.equal(normalizeNotificationType('direct_message'), 'chat');
});

test('should_map_legacy_achievement_to_info', () => {
  assert.equal(normalizeNotificationType('achievement'), 'info');
});

test('should_map_unknown_value_to_info_as_safe_default', () => {
  assert.equal(normalizeNotificationType('something_we_never_saw'), 'info');
});
