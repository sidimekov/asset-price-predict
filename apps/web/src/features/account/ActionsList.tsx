import {Button} from '@/shared/ui/Button';

export default function ActionsList() {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        // Опциональный тост с "Не реализовано"
        alert('Не реализовано');
    };

    return (
        <div className="space-y-4 w-80">
            <Button variant="primary" onClick={handleClick} aria-label="Редактировать фото профиля">
                Редактировать фото
            </Button>
            <Button variant="primary" onClick={handleClick} aria-label="Изменить пароль">
                Изменить пароль
            </Button>
            <Button variant="primary" onClick={handleClick} aria-label="Изменить имя пользователя">
                Изменить имя пользователя
            </Button>
            <Button variant="primary" onClick={handleClick} aria-label="Изменить логин">
                Изменить логин
            </Button>
            <Button variant="danger" onClick={handleClick} aria-label="Выйти из аккаунта">
                Выйти
            </Button>
        </div>
    );
}