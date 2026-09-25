# Tasks — Ownership behind CurrentUserProvider

## 1. Delegación + tests de seam

- [x] 1.1 Delegar el forbidden de `TaskService.findOwnedTask` a `currentUser.requireOwned`, y verificar `mvn -Dtest=TaskServiceTest,OwnershipApiIntegrationTest test` en verde (mock de `requireOwned` + contrato HTTP intacto)
- [x] 1.2 Sincronizar delta (`user-authentication` REQ-TO-001/REQ-UAC-001) con `openspec archive` (tras apply; coordinar con el cambio B si ambos tocan REQ-UAC-001) y verificar `openspec validate --strict`
