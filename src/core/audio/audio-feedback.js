// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Audio Feedback System

/**
 * Audio Feedback System
 * Plays sound effects for extraction events
 */

import { createLogger } from '../../utils/logger.js';
import { loadSettings } from '../storage/settings-storage.js';

const logger = createLogger('AudioFeedback');

// Audio contexts
let audioContext = null;
let audioEnabled = false;

// Sound definitions
const sounds = {
  extractionStart: {
    frequency: 800,
    duration: 0.1,
    type: 'sine'
  },
  extractionComplete: {
    frequency: [600, 800, 1000],
    duration: [0.1, 0.1, 0.15],
    type: 'sine'
  },
  extractionError: {
    frequency: [400, 350],
    duration: [0.15, 0.2],
    type: 'square'
  },
  buttonClick: {
    frequency: 1000,
    duration: 0.05,
    type: 'sine'
  },
  notification: {
    frequency: 880,
    duration: 0.1,
    type: 'sine'
  }
};

/**
 * Initialize audio system
 */
export async function initializeAudio() {
  try {
    // Load settings to check if audio is enabled
    const settings = await loadSettings();
    audioEnabled = settings.advanced?.audio_feedback || false;
    
    if (!audioEnabled) {
      logger.info('Audio feedback disabled in settings');
      return;
    }
    
    // Create audio context (lazy initialization)
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    logger.info('Audio feedback initialized');
    
  } catch (error) {
    logger.error('Audio initialization failed', error);
    audioEnabled = false;
  }
}

/**
 * Play sound by name
 * @param {string} soundName - Name of sound to play
 */
export async function playSound(soundName) {
  if (!audioEnabled) {
    return;
  }
  
  const sound = sounds[soundName];
  
  if (!sound) {
    logger.warn(`Unknown sound: ${soundName}`);
    return;
  }
  
  try {
    // Ensure audio context exists
    if (!audioContext) {
      await initializeAudio();
    }
    
    // Resume audio context if suspended (user interaction requirement)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Play sound based on type
    if (Array.isArray(sound.frequency)) {
      await playSequence(sound);
    } else {
      await playTone(sound.frequency, sound.duration, sound.type);
    }
    
  } catch (error) {
    logger.error(`Failed to play sound: ${soundName}`, error);
  }
}

/**
 * Play single tone
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
 * @private
 */
async function playTone(frequency, duration, type = 'sine') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  
  // Envelope (fade in/out to avoid clicks)
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, now + duration);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
  
  // Wait for sound to finish
  return new Promise(resolve => {
    setTimeout(resolve, duration * 1000);
  });
}

/**
 * Play sequence of tones
 * @param {Object} sound - Sound definition with frequency and duration arrays
 * @private
 */
async function playSequence(sound) {
  const { frequency, duration, type } = sound;
  
  for (let i = 0; i < frequency.length; i++) {
    await playTone(frequency[i], duration[i], type);
  }
}

/**
 * Play extraction start sound
 */
export function playExtractionStart() {
  playSound('extractionStart');
}

/**
 * Play extraction complete sound
 */
export function playExtractionComplete() {
  playSound('extractionComplete');
}

/**
 * Play extraction error sound
 */
export function playExtractionError() {
  playSound('extractionError');
}

/**
 * Play button click sound
 */
export function playButtonClick() {
  playSound('buttonClick');
}

/**
 * Play notification sound
 */
export function playNotification() {
  playSound('notification');
}

/**
 * Enable audio feedback
 */
export async function enableAudio() {
  audioEnabled = true;
  await initializeAudio();
  logger.info('Audio feedback enabled');
}

/**
 * Disable audio feedback
 */
export function disableAudio() {
  audioEnabled = false;
  logger.info('Audio feedback disabled');
}

/**
 * Check if audio is enabled
 * @returns {boolean}
 */
export function isAudioEnabled() {
  return audioEnabled;
}

/**
 * Test audio system
 */
export async function testAudio() {
  if (!audioEnabled) {
    await enableAudio();
  }
  
  await playExtractionStart();
  await new Promise(resolve => setTimeout(resolve, 300));
  await playExtractionComplete();
}

// TEST SCENARIOS:
// 1. Initialize audio system with settings enabled
// 2. Initialize audio system with settings disabled
// 3. Play extraction start sound (single tone)
// 4. Play extraction complete sound (sequence of 3 tones)
// 5. Play extraction error sound (sequence of 2 tones)
// 6. Play button click sound (short tone)
// 7. Play notification sound
// 8. Audio context resumes from suspended state
// 9. Enable/disable audio dynamically
// 10. Test audio plays sequence correctly
// 11. Handle unknown sound name gracefully
// 12. Handle audio context creation failure
// 13. Envelope prevents clicking sounds
