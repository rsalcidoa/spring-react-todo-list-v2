import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { I18nProvider, useT } from '../i18n';
import { es } from '../i18n/es';

afterEach(cleanup);

function Probe() {
  const { t, setLang } = useT();
  return (
    <div>
      <span>{t('app.title')}</span>
      <button onClick={() => setLang('en')}>switch</button>
    </div>
  );
}

describe('i18n', () => {
  it('defaults to Spanish and switches to English', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByText(es['app.title'])).toBeTruthy();

    fireEvent.click(screen.getByText('switch'));

    expect(screen.getByText('Board')).toBeTruthy();
  });
});
