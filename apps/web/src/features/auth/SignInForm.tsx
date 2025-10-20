import React, { useState } from 'react';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

const SignInForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({ email: '', password: '' });
        setIsLoading(true);

        let hasError = false;
        if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
            setErrors((prev) => ({ ...prev, email: 'Пожалуйста, введите корректный email' }));
            hasError = true;
        }
        if (!password) {
            setErrors((prev) => ({ ...prev, password: 'Пароль не может быть пустым' }));
            hasError = true;
        }

        if (!hasError) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            alert('Вход выполнен (мок)');
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Убрана явная типизация
                error={errors.email}
                ariaDescribedby="email-error"
            />
            <Input
                label="Ваш пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Убрана явная типизация
                error={errors.password}
                ariaDescribedby="password-error"
            />
            <Button type="submit" disabled={isLoading} ariaBusy={isLoading}>
                Подтвердить
            </Button>
        </form>
    );
};

export default SignInForm;
