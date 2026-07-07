import type { Book } from '../types/book';

export type MainTabParamList = {
  LibraryTab: undefined;
  DiscoverTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  Reader: {
    book: Book;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
