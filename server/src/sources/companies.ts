export interface WorkdayBoard {
  company: string;
  host: string;
  site: string;
}

export const companies = {
  greenhouse: {
    drweng: 'DRW',
    haven: 'Haven Studios',
    ivalua: 'Ivalua',
    studiokraftonboard: 'KRAFTON Montréal',
    maintainx: 'MaintainX',
    sonyinteractiveentertainmentglobal: 'Sony Interactive Entertainment',
    epicgames: 'Epic Games',
    lyft: 'Lyft',
    coveo: 'Coveo',
    alayacare: 'AlayaCare',
    towerresearchcapital: 'Tower Research Capital',
  } as Record<string, string>,

  lever: {
    bhvr: 'Behaviour Interactive',
    mirego: 'Mirego',
    xsolla: 'Xsolla',
    larian: 'Larian Studios',
    gomaterials: 'GoMaterials',
  } as Record<string, string>,

  ashby: {
    cohere: 'Cohere',
    ami: 'AMI',
    exegy: 'Exegy',
  } as Record<string, string>,

  smartrecruiters: {
    Ubisoft2: 'Ubisoft',
    ServiceNow: 'ServiceNow',
  } as Record<string, string>,

  workable: {
    'mila-2': 'Mila',
  } as Record<string, string>,

  workday: [
    { company: 'CAE', host: 'cae.wd3.myworkdayjobs.com', site: 'career' },
    { company: 'Autodesk', host: 'autodesk.wd1.myworkdayjobs.com', site: 'uni' },
    { company: 'Intact', host: 'intactfc.wd3.myworkdayjobs.com', site: 'intactfc' },
    { company: 'Desjardins', host: 'desjardins.wd10.myworkdayjobs.com', site: 'Desjardins' },
    { company: 'McKesson', host: 'mckesson.wd3.myworkdayjobs.com', site: 'External_Careers' },
    { company: 'Motorola Solutions', host: 'motorolasolutions.wd5.myworkdayjobs.com', site: 'Careers' },
    { company: 'PSP Investments', host: 'investpsp.wd3.myworkdayjobs.com', site: 'psp_careers' },
    { company: 'RBC', host: 'rbc.wd3.myworkdayjobs.com', site: 'RBCEARLYTALENT1' },
    { company: 'BMO', host: 'bmo.wd3.myworkdayjobs.com', site: 'external' },
    { company: 'CIBC', host: 'cibc.wd3.myworkdayjobs.com', site: 'campus' },
    { company: 'TD', host: 'td.wd3.myworkdayjobs.com', site: 'TD_Bank_Careers' },
    { company: 'Sun Life', host: 'sunlife.wd3.myworkdayjobs.com', site: 'Campus' },
    { company: 'Ciena', host: 'ciena.wd5.myworkdayjobs.com', site: 'Careers' },
    { company: 'Pratt & Whitney (RTX)', host: 'globalhr.wd5.myworkdayjobs.com', site: 'rec_rtx_ext_gateway' },
    { company: 'Harris Computer', host: 'harriscomputer.wd3.myworkdayjobs.com', site: '1' },
    { company: 'InterDigital', host: 'interdigital.wd5.myworkdayjobs.com', site: 'InterDigital_Intern' },
    { company: 'Teledyne', host: 'flir.wd1.myworkdayjobs.com', site: 'flircareers' },
    { company: 'Cadence', host: 'cadence.wd1.myworkdayjobs.com', site: 'Univ_Careers' },
    { company: 'Intelcom', host: 'intelcomgroup.wd3.myworkdayjobs.com', site: 'Intelcom' },
    { company: 'AtkinsRéalis', host: 'slihrms.wd3.myworkdayjobs.com', site: 'careers' },
    { company: 'Airbus', host: 'ag.wd3.myworkdayjobs.com', site: 'Airbus' },
    { company: 'ABB', host: 'abb.wd3.myworkdayjobs.com', site: 'external_career_page' },
    { company: 'Hitachi Rail', host: 'gtsgbu.wd3.myworkdayjobs.com', site: 'Careers' },
    { company: 'PwC', host: 'pwc.wd3.myworkdayjobs.com', site: 'Global_Campus_Careers' },
    { company: 'BDC', host: 'bdc.wd10.myworkdayjobs.com', site: 'BDC_Careers' },
    { company: 'McGill University', host: 'mcgill.wd3.myworkdayjobs.com', site: 'McGill_Careers' },
  ] as WorkdayBoard[],
};
