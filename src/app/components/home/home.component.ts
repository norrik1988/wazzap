import { Component, OnInit } from '@angular/core';
import { user } from '@angular/fire/auth';
import { FormControl } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
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
  user$ = this.usersService.currentUserProfile$;

  searchControl = new FormControl('');  
  

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

  constructor(private usersService: UsersService,
              private chatService: ChatsService) {}

  ngOnInit(): void {}

  createChat (otherUser: ProfileUser ) {
        this.chatService.createChat(otherUser).subscribe();
  }
}
