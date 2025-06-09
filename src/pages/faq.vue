<template>
  <div class="principal">
    <h1 class="titulo">Perguntas Frequentes (FAQ)</h1>
    <div class="box">
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="Somos uma comunidade colaborativa onde estudantes ajudam outros estudantes a aprender. Conectamos quem domina um assunto com quem precisa de uma força, promovendo aulas presenciais ou online, de forma simples, acessível e prática."
          title="1. O que é essa plataforma de mentoria entre alunos?"
        ></v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="Qualquer aluno que tenha domínio em alguma matéria e vontade de ajudar pode ser um mentor. Não precisa ser formado ou ter experiência como professor — basta ter disposição para ensinar de forma didática e colaborativa."
          title="2. Quem pode ser mentor?"
        ></v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="É só entrar na plataforma, procurar pela matéria em que você precisa de ajuda e escolher entre os mentores disponíveis. Você pode ver as informações de cada um e marcar a aula no horário que for melhor pra você, presencialmente ou online."
          title="3. Como faço para encontrar um mentor?"
        ></v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="É só entrar na plataforma, procurar pela matéria em que você precisa de ajuda e escolher entre os mentores disponíveis. Você pode ver as informaA proposta é ser acessível para todos, então muitas mentorias são oferecidas de forma gratuita, como uma troca de conhecimentos entre alunos. Mas também pode haver mentorias com um valor simbólico, dependendo do mentor e da matéria.ções de cada um e marcar a aula no horário que for melhor pra você, presencialmente ou online."
          title="4. Preciso pagar pelas mentorias?"
        ></v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="Sim! Você decide o que funciona melhor para você. Alguns mentores oferecem apenas aulas online, outros fazem presencial, e há quem ofereça os dois. A ideia é flexibilidade total."
          title="5. Posso escolher entre aulas online ou presenciais?"
        ></v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="Além de ajudar outras pessoas, você reforça o que já sabe, ganha confiança, desenvolve habilidades de comunicação e ainda pode registrar essa experiência como algo valioso no seu currículo. Ensinar é uma das formas mais eficientes de aprender."
          title="6. O que eu ganho sendo mentor?"
        ></v-expansion-panel>
      </v-expansion-panels>
      <v-expansion-panels variant="accordion" class="panel">
        <v-expansion-panel
          text="Sim! Prezamos pela segurança e pelo respeito dentro da comunidade. As interações são feitas dentro da plataforma, e você pode avaliar as experiências após cada mentoria. Estamos sempre por perto para oferecer suporte, se precisar."
          title="7. É seguro usar a plataforma?"
        ></v-expansion-panel>
      </v-expansion-panels>
    </div>
  </div>
</template>

<style scoped>
.principal {
  justify-items: center;
}

.titulo {
  margin-top: 30px;
  padding: 20px;
  font-family: 'Advent Pro';
}

.box {
  width: 950px;
  padding: 30px;
  margin-bottom: 40px;
}

.panel {
  padding: 10px;
}
</style>
