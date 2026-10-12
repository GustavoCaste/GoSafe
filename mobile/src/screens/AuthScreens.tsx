import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Switch, Text, View } from 'react-native';

/** Marca: mapa dobrado + escudo + símbolo feminino (assets/splash-icon.png). */
const BRAND_MARK = require('../../assets/splash-icon.png');
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner, Avatar, Button, Card, Chip, DemoDataNotice, Field, RatingBadge, Screen, styles as ui, type IconName } from '../components/ui';
import { authenticate, registerUser } from '../data/repository';
import { SAO_PAULO, TEST_ACCOUNT } from '../data/seed';
import { createSeededDatabase, currentUser, errorMessage, mutate } from '../data/store';
import { SEX_LABEL } from '../domain/labels';
import type { Sex } from '../domain/types';
import { currentFix, requestLocationPermission } from '../hooks/location';
import { useSubmitOnce } from '../hooks/useSubmitOnce';
import type { ScreenProps } from '../navigation/types';
import { colors } from '../theme';

export function WelcomeScreen({ navigation }: ScreenProps<'Welcome'>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryDark }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <Image source={BRAND_MARK} style={{ width: 120, height: 120, marginLeft: -12 }} accessibilityLabel="Marca GoSafe: escudo com símbolo feminino sobre um mapa" />
        <Text style={{ fontSize: 50, fontWeight: '800', color: '#FFF' }}>GoSafe</Text>
        <Text style={{ fontSize: 19, lineHeight: 27, color: '#E9DFF5' }}>
          Locais avaliados por mulheres, para mulheres. Veja relatos antes de sair de casa.
        </Text>
        {[
          ['location', 'Mapa com a nota de segurança dos locais'],
          ['chatbubbles', 'Avisos e relatos de outras usuárias'],
          ['shield-checkmark', 'Contas com identidade verificada'],
        ].map(([icon, text]) => (
          <View key={text} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Ionicons name={icon as 'location'} size={20} color={colors.coral} />
            <Text style={{ color: '#E9DFF5', fontSize: 15, flex: 1 }}>{text}</Text>
          </View>
        ))}
        <DemoDataNotice dark />
        <Text style={{ color: '#CFC2E0', fontSize: 13, lineHeight: 19 }}>
          Versão de teste: os dados ficam salvos só neste aparelho. A internet é usada apenas para desenhar o mapa.
        </Text>
      </View>
      <View style={{ padding: 24, gap: 12, maxWidth: 520, width: '100%', alignSelf: 'center' }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Benefits')}
          style={{ minHeight: 56, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.primaryDark, fontWeight: '800', fontSize: 17 }}>Começar</Text>
        </Pressable>
        <Text style={{ color: '#CFC2E0', textAlign: 'center', fontSize: 13 }}>
          As informações refletem a percepção da comunidade, não uma garantia de segurança.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Benefit({ icon, title, text, children }: { icon: IconName; title: string; text: string; children: ReactNode }) {
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <Text style={{ flex: 1, fontWeight: '700', fontSize: 17, color: colors.ink }}>{title}</Text>
      </View>
      <Text style={[ui.muted, { lineHeight: 20 }]}>{text}</Text>
      <View style={{ backgroundColor: colors.background, borderRadius: 14, padding: 12, gap: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.5 }}>EXEMPLO NO APP</Text>
        {children}
      </View>
    </Card>
  );
}

const pill = (background: string, color: string) => ({
  alignSelf: 'flex-start' as const,
  fontSize: 13,
  fontWeight: '700' as const,
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  backgroundColor: background,
  color,
  overflow: 'hidden' as const,
});

/** Vantagens do GoSafe, cada uma com um exemplo visível do que o app faz. */
export function BenefitsScreen({ navigation }: ScreenProps<'Benefits'>) {
  const signedIn = currentUser() !== null;

  return (
    <Screen
      title="Por que usar o GoSafe"
      footer={signedIn ? undefined : <Button label="Continuar" onPress={() => navigation.navigate('Permission')} />}
    >
      <Benefit icon="warning" title="Saiba antes de ir" text="Quando muitas usuárias avaliam um lugar como inseguro, ele recebe um alerta visível no mapa, na lista e na página do local.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bad, borderRadius: 15, paddingHorizontal: 10, height: 30, borderWidth: 2, borderColor: '#FFF' }}>
            <Text style={{ color: colors.bad, backgroundColor: '#FFF', borderRadius: 8, width: 16, textAlign: 'center', fontWeight: '800', fontSize: 12 }}>!</Text>
            <Text style={{ color: '#FFF', fontWeight: '700' }}>1,0</Text>
          </View>
          <Text style={{ flex: 1, color: colors.ink, fontSize: 13 }}>Terminal Leste · 10 avaliações</Text>
        </View>
        <AlertBanner compact />
      </Benefit>

      <Benefit icon="star" title="Encontre lugares acolhedores" text="A nota geral mostra onde as mulheres se sentem seguras, com detalhes de iluminação, movimento, acolhimento e banheiro.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <RatingBadge rating={4.98} />
          <Text style={{ flex: 1, color: colors.ink, fontSize: 13 }}>Café Aurora · Segurança 5,0 · Banheiro 4,8</Text>
        </View>
      </Benefit>

      <Benefit icon="location" title="Notas mais confiáveis" text="Quem está no local (check-in) e contas antigas, ativas e verificadas pesam mais na nota. Perfis recém-criados pesam menos.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Text style={pill(colors.goodSoft, '#155E50')}>Check-in confirmado · 40 m</Text>
          <Text style={pill(colors.primarySoft, colors.primary)}>Peso do voto 0,25</Text>
          <Text style={pill(colors.lineSoft, colors.muted)}>Sem check-in: 0,20</Text>
        </View>
      </Benefit>

      <Benefit icon="eye-off" title="Relate sem se expor" text="Avisos e comentários podem ser publicados como anônima. O nome fica oculto para as outras usuárias.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar name="?" size={34} color="#DCD5CC" />
          <Text style={{ flex: 1, fontSize: 13, color: colors.muted }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>Anônima</Text>
            <Text style={{ color: colors.good, fontWeight: '700' }}> · verificada</Text> · há 2 h
          </Text>
        </View>
      </Benefit>

      <Benefit icon="shield-checkmark" title="Contas reais" text="A verificação facial (opcional, simulada nesta versão) confirma que existe uma pessoa real por trás do perfil, sem guardar a imagem.">
        <Text style={pill(colors.goodSoft, '#155E50')}>Identidade verificada</Text>
      </Benefit>

      <DemoDataNotice />
    </Screen>
  );
}

/** RN01: pede a localização no 1º acesso e monta a carga de teste em volta dela. */
export function PermissionScreen() {
  const [busy, setBusy] = useState<string | null>(null);

  const prepare = async (askPermission: boolean) => {
    try {
      let center = SAO_PAULO;
      let aroundDevice = false;

      if (askPermission) {
        setBusy('Pedindo permissão…');
        if (await requestLocationPermission()) {
          setBusy('Obtendo sua localização…');
          const fix = await currentFix().catch(() => null);
          if (fix) {
            center = fix;
            aroundDevice = true;
          }
        }
      }

      setBusy('Preparando 20 locais e 50 usuárias de teste…');
      await new Promise((resolve) => setTimeout(resolve, 50));
      createSeededDatabase(center, aroundDevice);
    } catch (error) {
      setBusy(null);
      Alert.alert('Não foi possível preparar o app', errorMessage(error));
    }
  };

  return (
    <Screen back={false}>
      <View style={{ alignItems: 'center', gap: 24, paddingVertical: 32 }}>
        <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="location" size={48} color="#FFF" />
          </View>
        </View>
        <Text style={[ui.title, { textAlign: 'center' }]}>Ative sua localização</Text>
        <Text style={[ui.muted, { textAlign: 'center', fontSize: 16, lineHeight: 24 }]}>
          Usamos sua localização só para mostrar os locais avaliados perto de você e para o check-in. Ela nunca aparece para outras usuárias.
        </Text>
        <Text style={[ui.muted, { textAlign: 'center' }]}>
          Nesta versão de teste, os 20 locais de demonstração são criados em volta de onde você está.
        </Text>
      </View>
      {busy ? (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={ui.muted}>{busy}</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Button label="Permitir localização" icon="location" onPress={() => prepare(true)} />
          <Button label="Agora não (usar São Paulo)" variant="ghost" onPress={() => prepare(false)} />
        </View>
      )}
    </Screen>
  );
}

export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const submit = (value = login, secret = password) => {
    try {
      mutate((db) => {
        db.sessionUserId = authenticate(db, value, secret).id;
      });
    } catch (error) {
      Alert.alert('Não foi possível entrar', errorMessage(error));
    }
  };

  return (
    <Screen
      back={false}
      footer={
        <View style={{ gap: 6 }}>
          <Button label="Entrar" onPress={() => submit()} />
          <Button label="Criar conta" variant="ghost" onPress={() => navigation.navigate('Register')} />
        </View>
      }
    >
      <View style={{ gap: 8, marginTop: 24 }}>
        <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={BRAND_MARK} style={{ width: 66, height: 66 }} accessibilityLabel="Marca GoSafe" />
        </View>
        <Text style={[ui.title, { marginTop: 12 }]}>Entrar</Text>
        <Text style={ui.muted}>Bom te ver de novo.</Text>
      </View>
      <Field label="E-mail ou usuária" value={login} onChangeText={setLogin} autoCapitalize="none" autoComplete="username" placeholder="voce@email.com" />
      <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Sua senha" />
      <Card style={{ gap: 8, backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
        <Text style={{ fontWeight: '700', color: colors.primaryDark }}>Contas de teste</Text>
        <Text style={{ color: colors.primaryDark, fontSize: 13, lineHeight: 19 }}>
          Sua conta: <Text style={{ fontWeight: '700' }}>teste</Text> · senha <Text style={{ fontWeight: '700' }}>gosafe123</Text>
          {'\n'}As 50 usuárias da carga: <Text style={{ fontWeight: '700' }}>seed01</Text> a <Text style={{ fontWeight: '700' }}>seed50</Text>, mesma senha.
        </Text>
        <Button label="Entrar com a conta de teste" variant="secondary" onPress={() => submit(TEST_ACCOUNT.login, TEST_ACCOUNT.password)} />
      </Card>
      <DemoDataNotice />
    </Screen>
  );
}

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sex, setSex] = useState<Sex>('FEMALE');
  const [terms, setTerms] = useState(false);
  const once = useSubmitOnce();

  const submit = () =>
    once(() => {
      if (!terms) {
        Alert.alert('Termos de uso', 'Aceite os termos de uso e a política de privacidade para continuar.');
        return false;
      }
      try {
        mutate((db) => {
          db.sessionUserId = registerUser(db, { name, username, email, password, sex }).id;
        });
        return true;
      } catch (error) {
        Alert.alert('Não foi possível criar a conta', errorMessage(error));
        return false;
      }
    });

  return (
    <Screen title="Criar conta" footer={<Button label="Continuar" onPress={submit} />}>
      <Text style={ui.muted}>Passo 1 de 2 · depois você pode verificar sua identidade (opcional).</Text>
      <Field label="Nome completo" value={name} onChangeText={setName} autoComplete="name" />
      <Field label="Nome de usuária" value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="ex.: maria.silva" />
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
      <Text style={ui.label}>Sexo</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(SEX_LABEL) as Sex[]).map((option) => (
          <Chip key={option} label={SEX_LABEL[option]} selected={sex === option} onPress={() => setSex(option)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
        <Switch value={terms} onValueChange={setTerms} trackColor={{ true: colors.primary }} />
        <Text style={[ui.muted, { flex: 1 }]}>Li e aceito os Termos de uso e a Política de privacidade.</Text>
      </View>
      <Button label="Já tenho conta" variant="ghost" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

/** Verificação facial OPCIONAL e SIMULADA (sem custo, sem guardar imagem). */
export function VerificationScreen({ navigation }: ScreenProps<'Verification'>) {
  const [consent, setConsent] = useState(false);
  const [running, setRunning] = useState(false);
  const user = currentUser();
  if (!user) return null;

  const start = () => {
    if (!consent) {
      Alert.alert('Consentimento', 'É necessário autorizar o uso da imagem para a verificação.');
      return;
    }
    setRunning(true);
    setTimeout(() => {
      const score = 0.85 + Math.floor(Math.random() * 15) / 100;
      mutate((db) => {
        db.users[user.id].verified = true;
      });
      setRunning(false);
      Alert.alert('Identidade verificada', `Prova de vida aprovada · facematch ${score.toFixed(2)} (simulado).`, [
        { text: 'Ok', onPress: () => navigation.goBack() },
      ]);
    }, 1800);
  };

  if (user.verified) {
    return (
      <Screen title="Verificação facial">
        <Card style={{ alignItems: 'center', gap: 10 }}>
          <Ionicons name="shield-checkmark" size={48} color={colors.good} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>Identidade já verificada</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      title="Verificação facial"
      footer={
        <View style={{ gap: 6 }}>
          <Button label="Iniciar verificação" loading={running} onPress={start} />
          <Button label="Pular por enquanto" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      }
    >
      <Text style={ui.muted}>
        Opcional. Confirma que existe uma pessoa real por trás do perfil e reduz contas falsas. Perfis verificados começam com peso maior nas avaliações.
      </Text>
      <View style={{ aspectRatio: 4 / 3, maxHeight: 280, borderRadius: 20, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        {running ? <ActivityIndicator color={colors.coral} size="large" /> : <View style={{ width: 130, height: 170, borderRadius: 80, borderWidth: 3, borderStyle: 'dashed', borderColor: colors.coral }} />}
        <Text style={{ color: '#E9DFF5' }}>{running ? 'Verificando (simulação)…' : 'Câmera simulada nesta versão de teste'}</Text>
      </View>
      <Card style={{ gap: 6 }}>
        <Text style={{ fontWeight: '700' }}>1. Vídeo-selfie com prova de vida</Text>
        <Text style={ui.muted}>Garante que é uma pessoa ao vivo, não uma foto.</Text>
        <Text style={{ fontWeight: '700', marginTop: 6 }}>2. Comparação com o documento</Text>
        <Text style={ui.muted}>Foto do RG ou CNH comparada ao vídeo (facematch).</Text>
      </Card>
      <View style={{ backgroundColor: colors.primarySoft, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10 }}>
        <Ionicons name="lock-closed" size={20} color={colors.primary} />
        <Text style={{ flex: 1, color: colors.primaryDark, lineHeight: 20 }}>
          Biometria é dado sensível (LGPD, art. 11). As imagens são usadas só nesta validação e apagadas em seguida; guardamos apenas o resultado e a data.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
        <Switch value={consent} onValueChange={setConsent} trackColor={{ true: colors.primary }} />
        <Text style={{ flex: 1, color: colors.ink }}>Autorizo o uso da minha imagem apenas para esta verificação.</Text>
      </View>
    </Screen>
  );
}
