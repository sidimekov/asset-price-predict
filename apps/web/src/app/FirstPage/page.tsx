import Link from 'next/link';

export default function FirstPage() {
    return (
        <div>
            <p>Now you are here!</p>
            <Link href="/">Back to Home Page</Link>
        </div>
    );
}