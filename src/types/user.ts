export type User = {
  id?: string;
  name: string;
  email: string;
  stories: Story[];
  age: number;
  village: string;
  country: string;
  language: string;
};

export type Story = {
  id?: string;
  description?: string;
  title: string;
  audioFile?: Buffer;
  transcript?: string | null;
  translation?: string | null;
  createdAt?: Date;
};
