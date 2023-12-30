import { Component, ElementRef, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { user } from '@angular/fire/auth';
import { FormControl } from '@angular/forms';
import { Timestamp, addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { Observable, combineLatest, map, startWith, concatMap, take, switchMap, of, tap } from 'rxjs';
import { ProfileUser } from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { ChatsService } from 'src/app/services/chats.service';
import { UsersService } from 'src/app/services/users.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {

  @ViewChild('endOfChat') endOfChat: ElementRef | undefined;
  user$ = this.usersService.currentUserProfile$;

  searchControl = new FormControl('');  
  chatListControl = new FormControl('');
  messageControl = new FormControl ('');

  users$ = combineLatest([
    this.usersService.allUsers$,
    this.user$,
    this.searchControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([users, user, searchString]) => users.filter(u =>
      u.displayName?.toLowerCase().includes((searchString !== null ? searchString : '').toLowerCase()) && u.uid !== user?.uid
    ))
  );

myChats$ = this.chatService.myChats$;

selectedChat$ = combineLatest([
  this.chatListControl.valueChanges,
  this.myChats$,
]).pipe(
  map(([value, chats]) => {
    if (value !== null) {
      return chats.find(c => c.id === value);
    } else {
      // Gestione del caso in cui value è null
      return null;
    }
  })
);

messages$ = this.chatListControl.valueChanges.pipe(
  map(value => (value ? value[0] : null)),
  switchMap(chatId => {
    if (chatId !== null) {
      return this.chatService.getChatMessages$(chatId).pipe(
        tap(() => {
          this.scrollToBottom();
        })
      );
    } else {
      // If chatId is null, return an empty observable or handle the situation accordingly
      return of([]);
    }
  })
);




  constructor(private usersService: UsersService,
              private chatService: ChatsService) {}

  ngOnInit(): void {}

  createChat(otherUser: ProfileUser) {
    this.chatService
      .isExistingChat(otherUser?.uid)
      .pipe(
        switchMap((chatIds) => {
          if (chatIds && chatIds.length > 0) {
            // If chatIds exist, select the first one
            return of(chatIds[0]);
          } else {
            // If chatIds do not exist, create a new chat
            return this.chatService.createChat(otherUser);
          }
        })
      )
      .subscribe((chatId) => {
        // Set the chatId in the chatListControl
        this.chatListControl.patchValue(chatId);
      });
  }
  
  
  

  sendMessage() {
    const message = this.messageControl.value;
    const selectedChatIdArray = this.chatListControl.value;
  
    if (message && selectedChatIdArray && selectedChatIdArray.length > 0) {
      const selectedChatId = selectedChatIdArray[0];
      
      this.chatService.addChatMessage(selectedChatId, message).subscribe(() =>
        this.scrollToBottom()      
      );
      this.messageControl.setValue('');
    }
  }

  scrollToBottom  () {
    setTimeout(() => {
      if(this.endOfChat) {
        this.endOfChat.nativeElement.scrollIntoView({ behavior: 'smooth'})
      }
    }, 100);            
  }

}
