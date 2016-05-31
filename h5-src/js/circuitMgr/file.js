
//7�ļ�����--------------------------------------------------------------------��
const char * Manager::GetFilePath()
//��ȡ�ļ�·��
{
	return fileName;
}

bool Manager::SaveFile(const char * newFile)
//�����·
{
	ASSERT(newFile != NULL && newFile[0] != '\0');
	long i;
	FILE * fp;

	strcpy(fileName, newFile);	//�滻ԭ���ļ�·��
	fp = fopen(fileName, "wb");
	if(fp == NULL)	//�ļ����ܴ�
	{
		wndPointer->MessageBox("�ļ�����д !", "�����ļ�����", MB_ICONERROR);
		return false;
	}

	//1�����ļ��汾
	i = FILE_VERSION;
	fwrite(&i, sizeof(long), 1, fp);

	//2������������
	fwrite(&crunNum, sizeof(short), 1, fp);
	fwrite(&ctrlNum, sizeof(short), 1, fp);
	fwrite(&leadNum, sizeof(short), 1, fp);

	//3������
	for(i = crunNum-1; i >= 0; --i)
		crun[i]->SaveToFile(fp);

	//4����ؼ�
	for(i = ctrlNum-1; i >= 0; --i)
		ctrl[i]->SaveToFile(fp);

	//5���浼��
	for(i = leadNum-1; i >= 0; --i)
		lead[i]->SaveToFile(fp);

	//6������������
	fwrite(&moveBodySense, sizeof(int), 1, fp);		//�������һ�������ƶ��ľ���
	fwrite(&maxLeaveOutDis, sizeof(int), 1, fp);	//���ߺϲ�������
	fwrite(&textColor, sizeof(enum), 1, fp);		//������ɫ
	fwrite(&focusLeadStyle, sizeof(enum), 1, fp);	//���㵼����ʽ
	fwrite(&focusCrunColor, sizeof(enum), 1, fp);	//��������ɫ
	fwrite(&focusCtrlColor, sizeof(enum), 1, fp);	//����ؼ���ɫ
	focusBody.SaveToFile(fp);						//��������
	fwrite(&viewOrig, sizeof(POINT), 1, fp);		//�ӽǳ�ʼ����

	//7�ļ�������,�����ļ�����
	char tmpForReserve[FILE_RESERVE_SIZE] = {0};
	fwrite(tmpForReserve, FILE_RESERVE_SIZE, 1, fp);

	fclose(fp);
	return true;
}

bool Manager::ReadFile(const char * newFile)
//��ȡ��·
{
	ASSERT(newFile != NULL && newFile[0] != '\0');
	FILE * fp;
	int i;
	POINT pos1 = {NULL};
	Pointer body;

	fp = fopen(newFile, "rb");
	if(fp == NULL)
	{
		wndPointer->MessageBox("�ļ����ܲ����ڻ��ܶ�ȡ !", "��ȡ�ļ�����", MB_ICONERROR);
		return false;
	}

	//1��ȡ�ļ��汾
	fread(&i, sizeof(int), 1, fp);
	if(i != FILE_VERSION)	//�ļ��汾��ͬ,�����ȡ
	{
		fclose(fp);
		wndPointer->MessageBox("�ļ��汾���� !", "��ȡ�ļ�����", MB_ICONERROR);
		return false;
	}

	DeleteVector(circuitVector.begin(), circuitVector.end());	//�����������ĵ�·��Ϣ
	strcpy(fileName, newFile);	//�滻ԭ��·��

	try	//������Ϊ�ļ��������������
	{
		//2��ȡ��������
		fread(&crunNum, sizeof(short), 1, fp);
		fread(&ctrlNum, sizeof(short), 1, fp);
		fread(&leadNum, sizeof(short), 1, fp);

		//����ȡ�����������Ƿ��������ķ�Χ֮��
		if(crunNum < 0 || leadNum < 0 || ctrlNum < 0)
			goto READFILEERROR;
		if(crunNum>MAXCRUNNUM || leadNum>MAXLEADNUM || ctrlNum>MAXCTRLNUM)
			goto READFILEERROR;

		//Ϊÿ�����������ڴ�ռ�
		for(i = crunNum-1; i >= 0; --i)
			crun[i] = new CRUN(i, pos1);
		for(i = ctrlNum-1; i >= 0; --i)
			ctrl[i] = new CTRL(i, pos1, SOURCE, false);
		for(i = leadNum-1; i >= 0; --i)
			lead[i] = new LEAD(i, motiBody[0],motiBody[1], false);

		//3��ȡ���
		CRUN::ResetInitNum();
		for(i = crunNum-1; i >= 0; --i)
			crun[i]->ReadFromFile(fp, lead);

		//4��ȡ�ؼ�
		CTRL::ResetInitNum();
		for(i = ctrlNum-1; i >= 0; --i)
			ctrl[i]->ReadFromFile(fp, lead);

		//5��ȡ����
		LEAD::ResetInitNum();
		for(i = leadNum-1; i >= 0; --i)
			lead[i]->ReadFromFile(fp, lead, crun, ctrl);

		//6��ȡ��������
		fread(&moveBodySense, sizeof(UINT), 1, fp);		//�������һ�������ƶ��ľ���
		fread(&maxLeaveOutDis, sizeof(UINT), 1, fp);	//���ߺϲ�������
		fread(&textColor, sizeof(enum), 1, fp);			//������ɫ
		fread(&focusLeadStyle, sizeof(enum), 1, fp);	//���㵼����ʽ
		fread(&focusCrunColor, sizeof(enum), 1, fp);	//��������ɫ
		fread(&focusCtrlColor, sizeof(enum), 1, fp);	//����ؼ���ɫ
		body.ReadFromFile(fp, lead, crun, ctrl);		//��ȡ��������
		FocusBodySet(body);								//���ý�������
		fread(&viewOrig, sizeof(POINT), 1, fp);			//�ӽǳ�ʼ����

		dc->SetTextColor(LEADCOLOR[textColor]);								//��ʼ��������ɫ
		dc->SetViewportOrg(-viewOrig.x, -viewOrig.y);						//��ʼ���ӽǳ�ʼ����
		wndPointer->SetScrollPos(SB_HORZ, viewOrig.x/mouseWheelSense.cx);	//��ʼ��ˮƽ������
		wndPointer->SetScrollPos(SB_VERT, viewOrig.y/mouseWheelSense.cy);	//��ʼ����ֱ������

	}	//try

	catch(...)
	{
	READFILEERROR:
		fclose(fp);
		wndPointer->MessageBox("�ļ��������� !", "��ȡ�ļ�����", MB_ICONERROR);
		exit(0);
	}

	fclose(fp);				//�ر��ļ����
	PutCircuitToVector();	//����ǰ��·��Ϣ���浽����
	return true;			//�����˳�
}

void Manager::CreateFile()
//�������ļ�(�յ�)
{
	fileName[0] = '\0';											//·�����
	ClearCircuitState();										//�����·״̬��Ϣ
	DeleteVector(circuitVector.begin(), circuitVector.end());	//�����������ĵ�·��Ϣ
	leadNum = crunNum = ctrlNum = 0;							//����������Ϊ0
	PutCircuitToVector();										//����ǰ�յ�·��Ϣ���浽����
}