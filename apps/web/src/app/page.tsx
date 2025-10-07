import Link from 'next/link';

export default function Home() {
    return (
        <div>
            <h1>Welcome to the Home Page!</h1>
            <Link href="/FirstPage">Go to Next Page</Link>
            <br/>
            <Link href="/FirstPage">Go to Another Page</Link>
        </div>
    );
}
