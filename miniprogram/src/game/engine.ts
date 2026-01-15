
export interface GameConfig {
  digits: number;
  allowDuplicates: boolean;
}

export interface GuessResult {
  guess: string;
  exact: number; // Position and value match (A)
  total: number; // Value matches (including A, but ignoring position)
}

export class GameEngine {
  private secret: string;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.secret = this.generateNumber();
  }

  private generateNumber(): string {
    const { digits, allowDuplicates } = this.config;
    if (!allowDuplicates && digits > 10) {
      throw new Error("Cannot generate unique digits for length > 10");
    }

    if (allowDuplicates) {
      let result = "";
      for (let i = 0; i < digits; i++) {
        result += Math.floor(Math.random() * 10).toString();
      }
      return result;
    } else {
      const nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      // Fisher-Yates shuffle
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      return nums.slice(0, digits).join("");
    }
  }

  public checkGuess(guess: string): GuessResult {
    if (guess.length !== this.config.digits) {
      throw new Error(`Guess must be ${this.config.digits} digits long`);
    }

    let exact = 0;
    
    // Calculate Exact Matches (A)
    for (let i = 0; i < this.config.digits; i++) {
      if (guess[i] === this.secret[i]) {
        exact++;
      }
    }

    // Calculate Total Number Matches (ignoring position)
    // Frequency map logic
    const secretFreq: Record<string, number> = {};
    const guessFreq: Record<string, number> = {};

    for (const char of this.secret) {
      secretFreq[char] = (secretFreq[char] || 0) + 1;
    }
    for (const char of guess) {
      guessFreq[char] = (guessFreq[char] || 0) + 1;
    }

    let total = 0;
    for (const char in guessFreq) {
      if (secretFreq[char]) {
        total += Math.min(guessFreq[char], secretFreq[char]);
      }
    }

    return { guess, exact, total };
  }

  public getSecret(): string {
    // For debugging or giving up
    return this.secret;
  }
  
  public restart(): void {
      this.secret = this.generateNumber();
  }
}
