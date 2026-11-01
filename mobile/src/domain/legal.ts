/** Textos dos Termos de uso e da Política de privacidade exibidos no app. */
export type LegalDocument = 'terms' | 'privacy';

interface LegalContent {
  title: string;
  version: string;
  sections: { heading: string; text: string }[];
}

const PROJECT_CONTACT = 'https://github.com/GustavoCaste/GoSafe';

export const LEGAL_DOCUMENTS: Record<LegalDocument, LegalContent> = {
  terms: {
    title: 'Termos de uso',
    version: '31/10/2026',
    sections: [
      {
        heading: '1. O que é o GoSafe',
        text: 'O GoSafe é um aplicativo colaborativo, desenvolvido como Trabalho de Conclusão de Curso em Engenharia de Software na Universidade Católica do Salvador (UCSal), em que mulheres compartilham a percepção de segurança sobre locais. Ao criar uma conta, você aceita estes Termos e a Política de privacidade.',
      },
      {
        heading: '2. Não é garantia de segurança',
        text: 'As notas, os avisos e os comentários refletem percepções individuais, não uma garantia de segurança nem uma afirmação sobre um estabelecimento. O GoSafe não substitui os serviços de emergência: em situação de risco, ligue 190, ou 180 para a Central de Atendimento à Mulher.',
      },
      {
        heading: '3. Base inicial de locais',
        text: 'Parte dos locais e das notas iniciais foi preparada pela equipe a partir de fontes públicas. Essas notas iniciais são estimadas, não vêm de visitas de usuárias do GoSafe e aparecem identificadas no próprio comentário. Elas perdem influência à medida que usuárias reais avaliam os locais.',
      },
      {
        heading: '4. Sua conta',
        text: 'Mantenha sua senha em sigilo e informe dados verdadeiros. Você responde pelo que publicar na sua conta.',
      },
      {
        heading: '5. O que você pode publicar',
        text: 'Publique apenas relatos honestos sobre o que você viveu ou percebeu. Não é permitido publicar conteúdo falso, ofensivo, discriminatório ou que ameace alguém, expor dados pessoais de terceiros, acusar pessoas identificadas, nem fazer propaganda.',
      },
      {
        heading: '6. Publicação anônima',
        text: 'Você pode publicar como anônima: seu nome fica oculto para as outras usuárias. O vínculo com a sua conta continua guardado e pode ser consultado pela moderação e pela administração para analisar denúncias, ou fornecido quando houver ordem de autoridade competente.',
      },
      {
        heading: '7. Denúncias e moderação',
        text: 'Quem tem conta pode denunciar avisos, comentários e locais. A moderação analisa a denúncia e pode ocultar o conteúdo. Denúncias procedentes reduzem o peso das avaliações da autora e, em caso de abuso, a conta pode ser desativada.',
      },
      {
        heading: '8. Peso das avaliações',
        text: 'Cada avaliação tem um peso, que considera o tempo de conta, as contribuições válidas, as denúncias procedentes e o check-in no local. A nota do local é a média ponderada da avaliação mais recente de cada usuária.',
      },
      {
        heading: '9. Disponibilidade e alterações',
        text: 'Este é um projeto acadêmico, oferecido sem garantia de funcionamento contínuo. Estes Termos podem mudar; a versão em vigor fica sempre disponível no aplicativo.',
      },
      {
        heading: '10. Contato',
        text: `Dúvidas e pedidos podem ser enviados à equipe do projeto pelo repositório: ${PROJECT_CONTACT}`,
      },
    ],
  },
  privacy: {
    title: 'Política de privacidade',
    version: '31/10/2026',
    sections: [
      {
        heading: '1. Quem trata os dados',
        text: 'Os dados são tratados pela equipe do projeto GoSafe, Trabalho de Conclusão de Curso da UCSal, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).',
      },
      {
        heading: '2. Dados que coletamos',
        text: 'Conta: nome, nome de usuária, e-mail, sexo autodeclarado e senha, guardada apenas em formato criptografado (hash). Uso: locais cadastrados, avisos, comentários, avaliações, favoritos, check-ins e denúncias.',
      },
      {
        heading: '3. Localização',
        text: 'A localização é opcional. Ela é usada para mostrar locais próximos e para validar o check-in. No check-in, guardamos a distância até o local e a precisão do GPS, nunca as suas coordenadas. Sua localização não aparece para outras usuárias.',
      },
      {
        heading: '4. Para que usamos',
        text: 'Para manter sua conta, calcular as notas dos locais, publicar o que você compartilha e moderar denúncias. A base legal é o seu consentimento e a execução do serviço que você solicitou. Não vendemos dados nem os usamos para publicidade.',
      },
      {
        heading: '5. O que outras pessoas veem',
        text: 'Em conteúdo identificado, outras pessoas veem seu nome e seu nome de usuária, mesmo sem ter conta no GoSafe. Em conteúdo anônimo, veem apenas "Anônima". A moderação e a administração podem ver a autora real de um conteúdo denunciado.',
      },
      {
        heading: '6. Serviços de terceiros',
        text: 'O endereço de um local cadastrado é consultado no ViaCEP e no Nominatim (OpenStreetMap), e o mapa é carregado de serviços externos. Esses envios não incluem seu nome nem seu e-mail. Os dados ficam em provedores de hospedagem e banco de dados escolhidos pela equipe.',
      },
      {
        heading: '7. Biometria',
        text: 'Esta versão do GoSafe não coleta imagem do rosto, documento nem dado biométrico. A verificação facial estará em modo funcional em versões futuras.',
      },
      {
        heading: '8. Por quanto tempo guardamos',
        text: 'Os dados ficam guardados enquanto a conta estiver ativa. Se uma conta for desativada, ela deixa de funcionar, mas os dados e o conteúdo publicado permanecem no banco. A exclusão definitiva ainda não é automática e pode ser pedida à equipe.',
      },
      {
        heading: '9. Seus direitos',
        text: `Você pode confirmar o tratamento, acessar, corrigir e pedir a exclusão dos seus dados, além de revogar o consentimento. Peça pelo repositório do projeto: ${PROJECT_CONTACT}`,
      },
    ],
  },
};
