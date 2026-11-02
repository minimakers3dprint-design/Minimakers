# Minimakers beheer

## Supabase-status

- Project: `minimakers-admin` (`zasqagcsswaitkvmuzwt`), organisatie `Minimakers Webshop`, gratis abonnement, regio Europa.
- Database schema/RLS: migration `supabase/migrations/202610280001_minimakers_admin.sql` is toegepast.
- Productfoto’s: `supabase/migrations/202610280002_product_image_storage.sql` is toegepast. De productfoto-bucket is openbaar leesbaar voor de webshop; uploaden, vervangen en verwijderen kan alleen door goedgekeurde admins.
- Catalogus: 35 huidige webshopproducten zijn geïmporteerd; `supabase/seed_current_products.sql` is veilig opnieuw uitvoerbaar.
- Publieke registratie: uitgeschakeld. E-mailbevestiging: ingeschakeld.
- Frontendconfiguratie staat lokaal in `admin/config.js` en gebruikt uitsluitend de publiceerbare key.

## Lokaal openen

Start vanuit de projectmap:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` en `http://localhost:8000/admin/`.

## Nog af te ronden

1. De uitnodiging naar `minimakers3dprint@gmail.com` is verstuurd en het account staat in `public.admin_users`. Open de Supabase-uitnodiging zelf. Na terugkeer in `/admin/` stel je je wachtwoord in via **Wachtwoord instellen of wijzigen**; ik kan die credentialstap niet voor je uitvoeren. De uitnodiging is verstuurd voordat de productie-redirect was aangepast; als de link niet naar `/admin/` terugkeert, laat het weten.
2. Publiceer de gewijzigde websitebestanden naar de GitHub Pages-repository. De lokale map heeft geen Git-repository en de beschikbare GitHub-verbinding heeft geen schrijfrechten.

De bestaande SheetMonkey-checkout is behouden. Orders, betalingen en analytics zijn niet aangesloten op Supabase. De huidige catalogus bevat geen aparte kleurvarianten in de database; geïmporteerde bestaande productkaarten behouden hun bestaande kleurkeuzes.
