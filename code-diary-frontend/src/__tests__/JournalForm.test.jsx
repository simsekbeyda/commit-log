import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import JournalForm from '../components/JournalForm';

const setup = () => {
    const onSubmit = jest.fn().mockResolvedValue();
    render(<JournalForm submitLabel="Kaydet" onSubmit={onSubmit} onCancel={() => {}} />);
    return onSubmit;
};

test('geçersiz formda hata gösterir ve göndermez', () => {
    const onSubmit = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

    expect(screen.getByText('Başlık boş olamaz')).toBeInTheDocument();
    expect(screen.getByText('İçerik en az 20 karakter olmalı')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
});

test('geçerli formu kırpılmış değerlerle gönderir', async () => {
    const onSubmit = setup();
    fireEvent.change(screen.getByLabelText(/Başlık/), { target: { value: '  Spring notları  ' } });
    fireEvent.change(screen.getByLabelText(/İçerik/), {
        target: { value: 'Bugün Spring Data JPA ile sayfalama yaptım.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Kaydet' })).toBeEnabled());
    expect(onSubmit).toHaveBeenCalledWith({
        title: 'Spring notları',
        content: 'Bugün Spring Data JPA ile sayfalama yaptım.',
        tags: [],
    });
});

test('etiketleri normalize ederek gönderir', async () => {
    const onSubmit = setup();
    fireEvent.change(screen.getByLabelText(/Başlık/), { target: { value: 'Etiketli günlük' } });
    fireEvent.change(screen.getByLabelText(/İçerik/), {
        target: { value: 'Bugün etiketlerle çalışan bir form yazdım.' },
    });
    const tagInput = screen.getByLabelText(/Etiketler/);
    for (const tag of ['#Spring Boot', 'spring-boot', 'React']) {
        fireEvent.change(tagInput, { target: { value: tag } });
        fireEvent.keyDown(tagInput, { key: 'Enter' });
    }
    expect(screen.getByText('#spring-boot')).toBeInTheDocument();
    expect(screen.getByText('#react')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].tags).toEqual(['spring-boot', 'react']);
});
