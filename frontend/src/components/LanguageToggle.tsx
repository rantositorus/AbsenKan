import { Languages } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label={t('lang.label')}>
            <Languages className="size-4" />
            <span className="uppercase">{lang}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t('lang.label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={lang === 'id'} onClick={() => setLang('id')}>
          {t('lang.id')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={lang === 'en'} onClick={() => setLang('en')}>
          {t('lang.en')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
