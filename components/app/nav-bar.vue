<template>
  <div class="navbar bg-primary text-primary-content">
    <div class="navbar-start">
      <NuxtLink to="/" class="btn btn-ghost text-xl">
        Travel Log
      </NuxtLink>
    </div>
    <div class="navbar-end">
      <AppThemeToggle />
      <button class="btn btn-accent">
        Sign In
        <Icon name="tabler:brand-github" size="24" />
      </button>
    </div>
  </div>
</template>
