export interface DisplayText {
  id: number;
  title: string;
  content: string;
  order?: number;
}
export  interface CreateDisplayTextRequest{
  title:string;
  description:string;
  order:number;
}

export interface UpdateDisplayTextRequest{
  title:string;
  description:string;
  order:number;
}
