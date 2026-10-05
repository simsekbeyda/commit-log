import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthProvider';
import * as authApi from '../services/authService';

jest.mock('../services/authService');

const renderLogin = () =>
    render(
        <AuthProvider>
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<div>ana sayfa</div>} />
                </Routes>
            </MemoryRouter>
        </AuthProvider>,
    );

beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
});

test('demo butonu misafir hesabı açıp ana sayfaya yönlendirir', async () => {
    authApi.startDemo.mockResolvedValue({ data: { token: 'jwt', user: { username: 'guest-abc', guest: true } } });
    renderLogin();

    fireEvent.click(screen.getByRole('button', { name: 'Demo hesabıyla dene' }));

    expect(await screen.findByText('ana sayfa')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('commitlog-auth')).token).toBe('jwt');
});

test('hatalı girişte sunucu mesajını gösterir', async () => {
    authApi.login.mockRejectedValue({ response: { status: 401, data: { message: 'Kullanıcı adı veya şifre hatalı' } } });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/Kullanıcı adı/), { target: { value: 'ali' } });
    fireEvent.change(screen.getByLabelText(/Şifre/), { target: { value: 'yanlis-sifre' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Giriş yap' }).at(-1));

    expect(await screen.findByText('Kullanıcı adı veya şifre hatalı')).toBeInTheDocument();
    await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('ali', 'yanlis-sifre'));
    expect(localStorage.getItem('commitlog-auth')).toBeNull();
});
