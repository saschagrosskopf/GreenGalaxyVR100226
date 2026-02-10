
import { TranscriptionItem, User } from '../types';

/**
 * 🎙️ TRANSCRIPTION SERVICE (Anti-Recorder)
 * Handles real-time voice-to-text conversion and action item extraction.
 */
export class TranscriptionService {
    private static instance: TranscriptionService;
    private log: TranscriptionItem[] = [];
    private onUpdate?: (log: TranscriptionItem[]) => void;

    private constructor() { }

    public static getInstance(): TranscriptionService {
        if (!TranscriptionService.instance) {
            TranscriptionService.instance = new TranscriptionService();
        }
        return TranscriptionService.instance;
    }

    public setUpdateCallback(callback: (log: TranscriptionItem[]) => void) {
        this.onUpdate = callback;
    }

    /**
     * Records a snippet of text from a user
     */
    public recordSpeech(user: User, text: string) {
        const item: TranscriptionItem = {
            id: `audio_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            text,
            timestamp: Date.now(),
            // Simple heuristic for action items: if it starts with "I will" or "Action:" or contains "todo"
            isActionItem: /^(I will|Action:|To-do:|TODO:)/i.test(text) || text.toLowerCase().includes('need to')
        };

        this.log.push(item);
        if (this.onUpdate) this.onUpdate([...this.log]);

        console.log(`🎙️ Logged: [${user.name}] ${text} ${item.isActionItem ? '✨ ACTION ITEM' : ''}`);
    }

    public getFullLog(): TranscriptionItem[] {
        return [...this.log];
    }

    public clearLog() {
        this.log = [];
        if (this.onUpdate) this.onUpdate([]);
    }

    /**
     * Mocks a conversation for demo purposes
     */
    public mockConversation(user: User) {
        const lines = [
            "Good morning everyone, let's review the Q4 architecture.",
            "Action: I will update the physics colliders for the boardroom.",
            "The Gemini integration looks stable on our testing branch.",
            "TODO: Bob needs to verify the Google Cloud origin whitelist.",
            "I think the Infinite Canvas should be our main command center."
        ];

        lines.forEach((line, i) => {
            setTimeout(() => {
                this.recordSpeech(user, line);
            }, i * 3000);
        });
    }
}
