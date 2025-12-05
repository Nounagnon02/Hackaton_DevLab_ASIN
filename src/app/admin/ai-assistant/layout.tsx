import { AI } from '../actions';
import type { ReactNode } from 'react';

export default function AdminAILayout({ children }: { children: ReactNode }) {
    return <AI>{children}</AI>;
}
