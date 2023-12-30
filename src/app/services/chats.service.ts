import { Injectable } from '@angular/core';
import { Firestore, addDoc } from '@angular/fire/firestore';
import { ProfileUser } from '../models/user';
import { Observable, concatMap, map, take } from 'rxjs';
import { UsersService } from './users.service';
import { Timestamp, collection, doc, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { ref } from '@angular/fire/storage';
import { collectionData } from 'rxfire/firestore';
import { Chat, Message } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatsService {

  constructor(private firestore: Firestore, private usersService: UsersService) { }

  createChat(otherUser: ProfileUser): Observable<string> {
      const ref = collection(this.firestore, 'chats');
      return this.usersService.currentUserProfile$.pipe(
        take(1),
        concatMap( user => addDoc(ref, {
          userIds: [user?.uid, otherUser?.uid],
          users: [
            {
              displayName: user?.displayName ?? ''
            },
            {
              displayName: otherUser?.displayName ?? ''
            }
          ]
        })),
        map(ref => ref.id)
      )
  }

  get myChats$(): Observable<Chat[]> {
          const ref = collection(this.firestore, 'chats');
          return this.usersService.currentUserProfile$.pipe(
            concatMap((user) => {
              const myQuery = query(ref, where('userIds', 'array-contains', user?.uid))
              return collectionData(myQuery, { idField: 'id'}).pipe (
                map(chats => this.addChatName(user?.uid ?? '', chats as Chat[] ))
              ) as Observable<Chat[]>
            })
          )
  }

addChatName(currentUserId: string, chats: Chat[]): Chat[] {
  chats.forEach (chat => {
    const otherIndex = chat.userIds.indexOf (currentUserId) === 0 ? 1 : 0;
    const {displayName} = chat.users [otherIndex];
    chat.chatName = displayName
  })

  return chats
}

isExistingChat(otherUserId: string): Observable<string | null> {
      return this.myChats$.pipe(
        take(1),
        map(chats => {
          
          for(let i=0; i < chats.length; i++) {
              if(chats[i].userIds.includes(otherUserId)) {
                return chats[i].id;
              }
          }

          return null;
        })
      )
}

addChatMessage (chatId: string, message: string): Observable<any> {
  const ref = collection(this.firestore, 'chats', chatId, 'messages');
  const chatRef = doc(this.firestore, 'chats', chatId);
  const today = Timestamp.fromDate(new Date())

  return this.usersService.currentUserProfile$.pipe(
    take(1),
    concatMap((user) => addDoc (ref, {
      text: message,
      senderId: user?.uid,
      sentDate: today
    })),
    concatMap(() => updateDoc( chatRef, { lastMessage: message, lastMesageDate: today}))
  )
  }

  getChatMessages$(chatId: string): Observable<Message[]> {
    const ref = collection (this.firestore, 'chats', chatId, 'messages');
    const queryAll = query(ref, orderBy('sentDate' ,'asc'))
    return collectionData(queryAll) as Observable<Message[]>
  }

}
