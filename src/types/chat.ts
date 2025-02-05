export interface ChatMessage {
  id?: string;
  houseId: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  content: string;
  imageUrl?: string | null;
  read: boolean;
  createdAt: any;
}

export interface ChatUser {
  id: string;
  houseId: string;
  email: string;
  name?: string;
  photo?: string;
  online?: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
}