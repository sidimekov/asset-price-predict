import Link from 'next/link';

export default function SecondPage() {
    return (
        <div>
            <p style={{color: 'red'}}>Now you are here!</p>
            <Link href="/">Back to Home Page</Link>
        </div>
    );
}