import { Component, inject } from '@angular/core';
import { RoomDTO } from '../../../models/DTO/RoomDTO.Model';
import { RoomService } from '../../../services/room.service';
import { ToastrService } from 'ngx-toastr';
import { HotelDTO } from '../../../models/DTO/HotelDTO.Model';
import { RoomConstants } from '../../../utils/RoomConstants';
import { HotelService } from '../../../services/hotel.service';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-add-room-info',
  templateUrl: './add-room-info.component.html',
  styleUrl: './add-room-info.component.css'
})
export class AddRoomInfoComponent {
  roomForm: FormGroup;
  roomService : RoomService = inject(RoomService);
  hotelService : HotelService = inject(HotelService);
  toaster : ToastrService = inject(ToastrService);
  router : Router = inject(Router);
  selectedFile : File;
  imagePreviews: any[] = [];
  user : any;
  currHotel ;
  roomConstants = RoomConstants;


constructor(private fb: FormBuilder) { }
  ngOnInit(): void {
    this.currHotel = this.hotelService.hotelInfo;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      window.scrollTo(0, 0);
    });
    document.body.scrollTop = 0;

    if (this.hotelService.roomData != null && this.hotelService.roomData.length > 0) {
      
      this.roomForm = this.fb.group({
        rooms: this.fb.array(this.hotelService.roomData.map(room => this.createRoom(room)))
      });
    } else {
      this.roomForm = this.fb.group({
        rooms: this.fb.array([this.createRoom()])
      });
    }
  }

  createRoom(roomData: any = null) {
    if (roomData) {
      
      return this.fb.group({
        roomType: [roomData.roomType || this.roomConstants.roomTypes[0], Validators.required],
        maxOccupancy: [roomData.maxOccupancy || this.roomConstants.maxOccupancy[1], Validators.required],
        bedType: [roomData.bedType || this.roomConstants.bedSizes[0], Validators.required],
        baseFare: [roomData.baseFare || '', Validators.required],
        roomSize: [roomData.roomSize || this.roomConstants.roomSizes[0], Validators.required],
        acstatus: [roomData.acstatus || '', Validators.required],
        files: [[]]
      });
    } else {
      return this.fb.group({
        roomType: [this.roomConstants.roomTypes[0], Validators.required],
        maxOccupancy: [this.roomConstants.maxOccupancy[1], Validators.required],
        bedType: [this.roomConstants.bedSizes[0], Validators.required],
        baseFare: ['', Validators.required],
        roomSize: [this.roomConstants.roomSizes[0], Validators.required],
        acstatus: [this.roomConstants.acStatuses[0], Validators.required],
        files: [[]]
      });
    }
  }

get rooms(): FormArray {
  return this.roomForm.get('rooms') as FormArray;
}

addRoom(): void {
  this.rooms.push(this.createRoom());
}

removeRoom(index: number): void {
  this.rooms.removeAt(index);
}

onFileChange(event, roomIndex: number) {
  const files = event.target.files;
  this.processFiles(files, roomIndex);
}

removeImage(image) {
  const index = this.imagePreviews.indexOf(image);
  if (index !== -1) {
    this.imagePreviews.splice(index, 1);
  }
}

processFiles(files: FileList, roomIndex: number) {
  const roomControl = this.rooms.at(roomIndex) as FormGroup;

  roomControl?.get('files')?.setValue(files);
  this.imagePreviews[roomIndex] = [];

  for (let i = 0; i < files.length; i++) {
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviews[roomIndex].push(reader.result);
    };
    reader.readAsDataURL(files[i]);
  }
}

  onSubmit(): void {
    if (true) {
      const loadingToast = this.toaster.info('Adding Rooms...', 'Please wait', {
        disableTimeOut: true,
        closeButton: false,
        positionClass: 'toast-top-center'
      });
      
      let index = 0;
      this.rooms.controls.forEach((roomControl: FormGroup) => {
        const formData = new FormData();
        const roomValue = roomControl.value;
  
        Object.keys(roomValue).forEach(key => {
          if (key === 'files') {
            const files = roomValue[key];
            for (let i = 0; i < files.length; i++) {
              formData.append(key, files[i]);
            }
          } else {
            formData.append(key, roomValue[key]);
          }
        });
        if(this.currHotel) {
          formData.append('hotelId', this.currHotel.hotelId);
        }else{
          formData.append('hotelId', this.hotelService?.roomData[0]?.hotelId);
          formData.append('roomId', this.hotelService?.roomData[index].roomId);
          console.log(this.hotelService?.roomData[index].roomId)

          index++;
        }


        this.user = JSON.parse(localStorage.getItem("user"))
        this.roomService.createRoom(formData,this.user.token).subscribe({
          next : (res) => {
            //this.hotelService.hotelInfo = res.data;
            this.toaster.success("Room added successfully");
            this.roomForm.reset();
          },
          error : (err) => {
            this.toaster.clear();      
          },
          complete : () => {
            this.roomForm.reset();
            this.toaster.clear();      
            this.hotelService.step = 3;
          }
        });
      } 
      );
    } 
    
    else {
      // Form is invalid, display error messages or handle accordingly
    }
  }
}
