export interface Comment {
    id?: string;
    houseId: string;
    postId: string;
    authorId: string;
    authorEmail: string;
    content: string;
    createdAt: any;
  }
  
  export interface Post {
    id?: string;
    houseId: string;
    title: string;
    content: string;
    authorId: string;
    authorEmail: string;
    likes: string[];
    imageUrl?: string;
    createdAt: any;
    comments?: Comment[];
  }