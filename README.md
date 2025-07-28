# Travel Backend

NestJS backend for the Travel Planning application with Supabase integration.

## Features

- RESTful API with NestJS
- Authentication with JWT
- Database integration with Prisma + Supabase
- Automatic deployment to Google Cloud Run via GitHub Actions

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Supabase account

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Push database schema:
```bash
npm run prisma:push
```

5. Start development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`.

## Deployment

### Cloud Build Setup

1. Enable required APIs:
```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

2. Create secrets in Secret Manager:
```bash
echo "your-database-url" | gcloud secrets create database-url --data-file=-
echo "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo "your-supabase-url" | gcloud secrets create supabase-url --data-file=-
echo "your-supabase-anon-key" | gcloud secrets create supabase-anon-key --data-file=-
```

3. Grant Cloud Build service account access to secrets:
```bash
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding supabase-url \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding supabase-anon-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

4. Grant Cloud Build service account Cloud Run permissions:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

5. Connect your repository to Cloud Build and set up trigger on main branch push

### Manual Deployment

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Scripts

- `npm run build` - Build the application
- `npm run start:prod` - Start in production mode
- `npm run start:dev` - Start in development mode with hot reload
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push database schema