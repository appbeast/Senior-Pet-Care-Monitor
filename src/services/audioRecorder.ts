export interface VoiceRecordingResult {
  audioUrl: string; // Base64 data URL for offline durability
  durationSeconds: number;
}

export class VoiceNoteRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime = 0;
  private timerId: number | null = null;

  async startRecording(maxDurationSeconds = 10, onAutoStop?: () => void): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.mediaRecorder.start();

      // Automatically stop after max duration (10s)
      this.timerId = window.setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopRecording();
          if (onAutoStop) onAutoStop();
        }
      }, maxDurationSeconds * 1000);

      return true;
    } catch (err) {
      console.warn('Microphone access unavailable or denied:', err);
      return false;
    }
  }

  async stopRecording(): Promise<VoiceRecordingResult | null> {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (!this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        const duration = Math.min(10, Math.round((Date.now() - this.startTime) / 1000));
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Stop all audio tracks to release microphone hardware
        if (this.mediaRecorder && this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        }

        // Convert to durable Base64 Data URL for IndexedDB storage
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            audioUrl: reader.result as string,
            durationSeconds: Math.max(1, duration),
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(audioBlob);
      };

      const recorder = this.mediaRecorder;
      if (recorder && recorder.state === 'recording') {
        recorder.stop();
      }
    });
  }

  cancelRecording(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      if (this.mediaRecorder.stream) {
        this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }
      this.mediaRecorder.stop();
    }
    this.audioChunks = [];
  }
}
