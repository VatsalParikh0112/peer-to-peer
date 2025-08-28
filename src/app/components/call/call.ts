// src/app/call/call.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: `./call.html`
})
export class CallComponent implements OnInit, OnDestroy {
  @Input({ required: true }) callObject: any;
  @Output() callEnded = new EventEmitter<void>();
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  ngOnInit() {
    this.callObject.on('feeds_changed', this.handleFeedsChanged);
    this.callObject.on('hangup', this.handleHangup);
    this.handleFeedsChanged(this.callObject.feeds);
  }
  
  handleFeedsChanged = (feeds: any[]) => {
    if (!feeds) return;
    const localFeed = feeds.find(f => f.isLocal());
    const remoteFeed = feeds.find(f => !f.isLocal());
    if (localFeed && this.localVideo?.nativeElement) this.localVideo.nativeElement.srcObject = localFeed.stream;
    if (remoteFeed && this.remoteVideo?.nativeElement) this.remoteVideo.nativeElement.srcObject = remoteFeed.stream;
  };

  handleHangup = () => this.callEnded.emit();
  hangup = () => this.callObject.hangup();

  ngOnDestroy() {
    this.callObject.removeListener('feeds_changed', this.handleFeedsChanged);
    this.callObject.removeListener('hangup', this.handleHangup);
  }
}