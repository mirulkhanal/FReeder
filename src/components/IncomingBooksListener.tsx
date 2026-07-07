import React from 'react';
import { useIncomingBooks } from '../hooks/useIncomingBooks';

export function IncomingBooksListener() {
  useIncomingBooks();
  return null;
}
