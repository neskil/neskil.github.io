const fs = require('fs');
let c = fs.readFileSync('tests.html', 'utf8');
const start = c.indexOf('// ── B. LEVEL INITIALISATION');
const end = c.indexOf('// ─── 5. RUN TESTS AND RENDER RESULTS');
if (start > 0 && end > 0) {
    const newTests = `// ─── 4. BEHAVIORAL SMOKE TESTS ───────────────────────────────────────────────
category('Behavioral Smoke Tests');

let testGame;

test('Engine Initialization', () => {
  mockLocalStorage.clear();
  testGame = new CargoGame();
  
  // Initialize game (this should set up rendering and physics)
  // requestAnimationFrame is mocked so it won't actually loop automatically
  testGame.init();
  
  assert(testGame.physics != null, 'Game physics should be initialized');
});

test('Level Loading', () => {
  assert(levels && levels.length > 0, 'Levels should exist to be tested');
  
  // Load each level sequentially
  for (let i = 0; i < levels.length; i++) {
    testGame.setLevel(i);
    assert(testGame.currentLevelIndex === i, 'Game should successfully load level ' + i);
    assert(testGame.physics.lander != null, 'Lander should be spawned for level ' + i);
  }
});

test('Update Loop Simulation', () => {
  // Run the update loop for the last loaded level for several frames
  for (let i = 0; i < 100; i++) {
    // 16ms delta time
    testGame.update(16);
  }
  // If no error is thrown, this test passes
});

test('Input Simulation - Movement', () => {
  // Simulate thrusters and rotation
  const mockKeys = ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'];
  
  mockKeys.forEach(k => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: k }));
  });
  
  testGame.update(16);
  
  mockKeys.forEach(k => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: k }));
  });
  
  testGame.update(16);
});

test('Input Simulation - Action Keys', () => {
  // Simulate cargo manipulation (Q, E) and space
  const mockKeys = ['KeyQ', 'KeyE', 'Space'];
  
  mockKeys.forEach(k => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: k }));
  });
  
  testGame.update(16);
  
  mockKeys.forEach(k => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code: k }));
  });
  
  testGame.update(16);
});

test('Level Restart & State Cleanup', () => {
  // Simulate player restarting the level
  testGame.setLevel(testGame.currentLevelIndex);
  
  // Ensure we can run an update tick immediately after restart without crashes
  testGame.update(16);
});

test('Game Over Simulation', () => {
  // Force a crash
  if (testGame.physics && testGame.physics.lander) {
    testGame.physics.lander.crashed = true;
  }
  testGame.update(16);
  
  // Assert game handled the crash
  assert(testGame.crashHandled === true, 'Game should handle crashes without throwing');
});

`;
    c = c.substring(0, start) + newTests + c.substring(end);
    fs.writeFileSync('tests.html', c);
    console.log('Replaced successfully');
} else {
    console.log('Could not find markers');
}
