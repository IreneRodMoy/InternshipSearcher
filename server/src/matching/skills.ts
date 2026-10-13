import { words } from '../lib/text.js';

export type Domain = 'software' | 'web' | 'mobile' | 'data' | 'ml' | 'cloud' | 'security' | 'embedded' | 'games' | 'qa' | 'product' | 'quant';

interface Skill {
  name: string;
  domain: Domain;
  aliases?: string[];
  caseSensitive?: RegExp;
}

const SKILLS: Skill[] = [
  { name: 'Python', domain: 'software' },
  { name: 'Java', domain: 'software' },
  { name: 'C++', domain: 'software', aliases: ['cpp', 'c plus plus'] },
  { name: 'C#', domain: 'software', aliases: ['csharp', 'c sharp', '.net', 'dotnet'] },
  { name: 'C', domain: 'embedded', caseSensitive: /(?<![\w+#/-])C(?![\w+#/-])(?!\s*\+)/ },
  { name: 'Go', domain: 'cloud', aliases: ['golang'] },
  { name: 'Rust', domain: 'software' },
  { name: 'Kotlin', domain: 'mobile' },
  { name: 'Swift', domain: 'mobile', aliases: ['swiftui'] },
  { name: 'Ruby', domain: 'web', aliases: ['ruby on rails', 'rails'] },
  { name: 'PHP', domain: 'web', aliases: ['laravel'] },
  { name: 'Scala', domain: 'data' },
  { name: 'R', domain: 'data', caseSensitive: /(?<![\w&/-])R(?![\w&/-])(?=[\s,).;]|$)/ },
  { name: 'MATLAB', domain: 'embedded' },
  { name: 'Bash', domain: 'cloud', aliases: ['shell scripting', 'shell', 'powershell'] },
  { name: 'SQL', domain: 'data', aliases: ['mysql', 'postgresql', 'postgres', 'sqlite', 't-sql', 'pl/sql'] },
  { name: 'NoSQL', domain: 'data', aliases: ['mongodb', 'mongo', 'dynamodb', 'cassandra', 'redis'] },
  { name: 'JavaScript', domain: 'web', aliases: ['js', 'es6', 'ecmascript'] },
  { name: 'TypeScript', domain: 'web' },
  { name: 'HTML/CSS', domain: 'web', aliases: ['html', 'css', 'html5', 'css3', 'sass', 'tailwind'] },
  { name: 'React', domain: 'web', aliases: ['react.js', 'reactjs', 'next.js', 'nextjs'] },
  { name: 'Angular', domain: 'web', aliases: ['angularjs'] },
  { name: 'Vue', domain: 'web', aliases: ['vue.js', 'vuejs', 'nuxt'] },
  { name: 'Node.js', domain: 'web', aliases: ['node', 'nodejs', 'express', 'express.js'] },
  { name: 'Django', domain: 'web', aliases: ['flask', 'fastapi'] },
  { name: 'Spring', domain: 'software', aliases: ['spring boot', 'springboot'] },
  { name: 'GraphQL', domain: 'web' },
  { name: 'REST APIs', domain: 'web', aliases: ['restful', 'rest api', 'rest apis', 'api design'] },
  { name: 'React Native', domain: 'mobile', aliases: ['flutter', 'dart'] },
  { name: 'Android', domain: 'mobile' },
  { name: 'iOS', domain: 'mobile' },
  { name: 'Git', domain: 'software', aliases: ['github', 'gitlab', 'version control'] },
  { name: 'Linux', domain: 'cloud', aliases: ['unix'] },
  { name: 'Docker', domain: 'cloud', aliases: ['containers', 'containerization'] },
  { name: 'Kubernetes', domain: 'cloud', aliases: ['k8s', 'helm'] },
  { name: 'AWS', domain: 'cloud', aliases: ['amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'Azure', domain: 'cloud', aliases: ['microsoft azure'] },
  { name: 'GCP', domain: 'cloud', aliases: ['google cloud', 'bigquery'] },
  { name: 'CI/CD', domain: 'cloud', aliases: ['ci cd', 'continuous integration', 'github actions', 'jenkins', 'gitlab ci'] },
  { name: 'Terraform', domain: 'cloud', aliases: ['infrastructure as code', 'ansible'] },
  { name: 'Microservices', domain: 'cloud', aliases: ['distributed systems'] },
  { name: 'Machine Learning', domain: 'ml', aliases: ['ml', 'apprentissage automatique', 'scikit-learn', 'sklearn'] },
  { name: 'Deep Learning', domain: 'ml', aliases: ['neural networks', 'apprentissage profond'] },
  { name: 'PyTorch', domain: 'ml', aliases: ['torch'] },
  { name: 'TensorFlow', domain: 'ml', aliases: ['keras'] },
  { name: 'LLMs', domain: 'ml', aliases: ['llm', 'large language models', 'genai', 'generative ai', 'rag', 'prompt engineering', 'langchain', 'openai', 'hugging face', 'huggingface', 'transformers'] },
  { name: 'NLP', domain: 'ml', aliases: ['natural language processing'] },
  { name: 'Computer Vision', domain: 'ml', aliases: ['opencv', 'image processing'] },
  { name: 'Reinforcement Learning', domain: 'ml' },
  { name: 'AI', domain: 'ml', aliases: ['artificial intelligence', 'intelligence artificielle'], caseSensitive: /\b(AI|IA)\b/ },
  { name: 'Pandas', domain: 'data', aliases: ['numpy', 'scipy', 'jupyter'] },
  { name: 'Data Analysis', domain: 'data', aliases: ['data analytics', 'analyse de donnees', 'statistics', 'statistiques'] },
  { name: 'Spark', domain: 'data', aliases: ['pyspark', 'hadoop', 'databricks'] },
  { name: 'ETL', domain: 'data', aliases: ['data pipelines', 'airflow', 'dbt', 'kafka'] },
  { name: 'Power BI', domain: 'data', aliases: ['tableau', 'looker', 'business intelligence'] },
  { name: 'Excel', domain: 'data', aliases: ['vba'] },
  { name: 'Testing', domain: 'qa', aliases: ['unit testing', 'unit tests', 'test automation', 'jest', 'pytest', 'junit', 'selenium', 'cypress', 'playwright', 'tdd'] },
  { name: 'QA', domain: 'qa', aliases: ['quality assurance', 'assurance qualite'] },
  { name: 'Security', domain: 'security', aliases: ['cybersecurity', 'cybersecurite', 'securite', 'penetration testing', 'owasp', 'cryptography'] },
  { name: 'Networking', domain: 'security', aliases: ['tcp/ip', 'computer networks', 'reseaux informatiques'] },
  { name: 'Embedded Systems', domain: 'embedded', aliases: ['embedded', 'firmware', 'microcontrollers', 'rtos', 'arduino', 'raspberry pi', 'stm32'] },
  { name: 'FPGA', domain: 'embedded', aliases: ['verilog', 'vhdl', 'systemverilog'] },
  { name: 'Robotics', domain: 'embedded', aliases: ['ros', 'robotique'] },
  { name: 'Unity', domain: 'games', aliases: ['unity3d'] },
  { name: 'Unreal Engine', domain: 'games', aliases: ['unreal', 'ue5', 'ue4', 'blueprints'] },
  { name: 'Graphics', domain: 'games', aliases: ['opengl', 'vulkan', 'directx', 'shaders', 'rendering'] },
  { name: 'Agile', domain: 'product', aliases: ['scrum', 'kanban', 'jira'] },
  { name: 'Figma', domain: 'product', aliases: ['ux design', 'ui design', 'wireframes', 'prototyping'] },
  { name: 'Algorithms', domain: 'software', aliases: ['data structures', 'algorithmes', 'structures de donnees'] },
  { name: 'OOP', domain: 'software', aliases: ['object oriented', 'object-oriented', 'oriente objet', 'design patterns'] },
  { name: 'Probability', domain: 'quant', aliases: ['stochastic', 'linear algebra', 'calculus', 'probabilites'] },
  { name: 'French', domain: 'product', aliases: ['francais', 'bilingual', 'bilingue'] },
];

const compiled = SKILLS.map((skill) => ({
  ...skill,
  pattern: words([skill.name, ...(skill.aliases ?? [])].filter((a) => !skill.caseSensitive || a !== skill.name)),
}));

export function findSkills(original: string, folded: string): Skill[] {
  return compiled.filter((skill) => (skill.caseSensitive?.test(original) ?? false) || skill.pattern.test(folded));
}

export const DOMAIN_TITLES: [Domain, RegExp][] = [
  ['ml', /machine learning|\bml\b|\bai\b|\bia\b|artificial|intelligence|deep learning|nlp|vision|llm|genai|research/],
  ['data', /data|donnees|analytics|business intelligence|\bbi\b/],
  ['web', /web|front|full[\s-]?stack|back[\s-]?end|ui\b/],
  ['mobile', /mobile|ios|android/],
  ['cloud', /cloud|devops|sre|reliability|infrastructure|platform|plateforme|systems/],
  ['security', /security|securite|cyber/],
  ['embedded', /embedded|firmware|hardware|robot|fpga|electrical|electronique/],
  ['games', /game|jeu|gameplay|unreal|unity|graphics|technical design/],
  ['qa', /\bqa\b|quality|test|automation|automatisation/],
  ['product', /product|produit|ux|design/],
  ['quant', /quant|trading|trader/],
];
