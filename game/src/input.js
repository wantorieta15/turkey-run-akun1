// Kalkun Kabur — input.js
// Keyboard + mouse/tap. Satu tombol lompat, satu tombol menunduk, sisanya
// kontrol menu. Status tombol dibaca tiap frame oleh loop utama.

export class Input {
  constructor(canvas, onTap) {
    this.jumpHeld = false;
    this.duckHeld = false;
    this.jumpPressed = false;
    this.anyPressed = false;
    this.onTap = onTap;
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      this.keys.add(event.code);
      this.anyPressed = true;
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.jumpHeld = true;
        this.jumpPressed = true;
        event.preventDefault();
      }
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        this.duckHeld = true;
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') this.jumpHeld = false;
      if (event.code === 'ArrowDown' || event.code === 'KeyS') this.duckHeld = false;
    });
    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.anyPressed = true;
      this.jumpPressed = true;
      this.jumpHeld = true;
      if (this.onTap) this.onTap(event.clientX, event.clientY);
    });
    canvas.addEventListener('pointerup', () => {
      this.jumpHeld = false;
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.jumpHeld = false;
      this.duckHeld = false;
    });
  }

  pressed(code) {
    return this.keys.has(code);
  }

  // Dipanggil sekali tiap frame oleh loop: tombol yang ditekan sejak frame lalu.
  consumeJump() {
    const value = this.jumpPressed;
    this.jumpPressed = false;
    return value;
  }

  consumeAny() {
    const value = this.anyPressed;
    this.anyPressed = false;
    return value;
  }
}
