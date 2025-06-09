<template>
  <div class="texto">
    <h1 class="titulo">Quem somos</h1>
    <div class="corpo-do-texto">
      <p>
        Somos uma plataforma colaborativa de mentoria entre alunos, criada para transformar a maneira como o conhecimento é compartilhado. Acreditamos que todos têm algo a ensinar e a aprender, e que o processo de ensino pode ser tão enriquecedor quanto o de aprendizagem.

        Nosso site conecta estudantes que dominam determinados assuntos com outros alunos que precisam de ajuda, promovendo aulas presenciais ou online, de forma prática, flexível e acessível.

        Aqui, os próprios alunos tornam-se mentores, compartilhando seus conhecimentos de forma didática, enquanto aprofundam ainda mais sua compreensão ao ensinar. Seja para tirar dúvidas pontuais ou reforçar o aprendizado em matérias específicas, nossa comunidade é o espaço ideal para crescer junto.
        Acreditamos que ninguém aprende sozinho — e que ensinar também é uma forma incrível de aprender. Por isso, criamos uma plataforma onde alunos ajudam outros alunos, compartilhando conhecimento de forma leve, prática e sem complicação.

        Funciona assim: se você manda bem em alguma matéria, pode virar mentor e ajudar quem está com dificuldades. Se está precisando de uma força em alguma disciplina, é só procurar alguém que possa te dar essa ajuda — presencialmente ou online, do jeito que funcionar melhor pra você.

        Mais do que um site, somos uma comunidade que cresce junto. Aqui, todo mundo ensina, todo mundo aprende. Porque no fim das contas, ensinar é uma das melhores formas de fixar o conteúdo, ganhar confiança e evoluir.

        Aprenda ensinando. E ensine aprendendo.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "aboutUs"
}
</script>

<style scoped>
.texto {
  justify-items: center;
}

.titulo {
  padding: 30px;
  margin-top: 30px;
  font-family: 'Advent Pro';
}

.corpo-do-texto {
  width: 950px;
  padding: 30px;
  margin-bottom: 40px;
  font-size: 20px;
  text-align: justify;
  font-family: 'Advent Pro';
  font-weight: 500;
}


</style>
