import { Timestamp } from '@firebase/firestore';
import { ProfileUser } from 'src/app/models/user';
;

export interface Chat {
    id: string;
    lastMessge?: string;
    lastMessageDate?: Date & Timestamp;
    lastName?: string;
    userIds: string [];
    users: ProfileUser [];

    chatPic?: string;
    chatName?: string;


  }

  export interface Message {
        text: string;
        senderId: string;
        sentDate: Date & Timestamp;

  }