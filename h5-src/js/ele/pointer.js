
//指向3个基本物体的结构
var Pointer = {

	/*
	// 指向基本物体
	void * p;	
	
	// 物体的位置:
	// -3,-5,-7,... 横线 , -2,-4,-6,... 竖线
	// -1 物体(结点,控件)
	// 1,2,3,4 上下左右连接点
	// 0不指向物体
	// 5,6,7...不合法
	int atState;
	
	// 指向物体类型
	BODY_TYPE style;
	*/

	CreateNew: function() {
		var newObj = {p: null, atState: 0, style: BODY_NO};
		newObj.__proto__ = Pointer;
		return newObj;
	},
	//保存信息到json
	GenerateStoreJsonObj: function() {
		var index = 0;
		if (this.p != null)
			index = this.p.index;

		return {"index":index, "atState":this.atState, "style":this.style};
	},
	Clone: function(){
		var newObj = {p: this.p, atState: this.atState, style: this.style};
		newObj.__proto__ = Pointer;
		return newObj;
	},
	//从json读取信息
	ReadFromStoreJsonObj: function(jsonObj, leadList, crunList, ctrlList) {
		this.Clear();
		
		this.atState = jsonObj.atState;
		this.style = jsonObj.style;
		
		var index = jsonObj.index;
		if (this.IsOnLead()) {
			if (index >= 0 && index < leadList.length)
				this.SetOnLead(leadList[index], false);
			else
				return false;
		} else if (this.IsOnCrun()) {
			if (index >= 0 && index < crunList.length)
				this.SetOnCrun(crunList[index], false);
			else
				return false;
		} else if (this.IsOnCtrl()) {
			if (index >= 0 && index < ctrlList.length)
				this.SetOnCtrl(ctrlList[index], false);
			else
				return false;
		} else {
			return false;
		}

		return true;
	},
	
	//清空指针
	Clear: function() {
		this.p = null;
		this.atState = 0;
		this.style = BODY_NO;
	},

	//设置addState
	SetAtState: function(newState) {
		this.atState = newState;
	},
	//获得addState
	GetAtState: function() {
		return this.atState;
	},
	//获得style
	GetStyle: function() {
		return this.style;
	},
	//判断结构体是否指向物体
	IsOnAny: function() {
		return this.atState != 0 && this.atState <= 4;
	},
	//判断是否在导线上
	IsOnLead: function() {
		return BODY_LEAD == this.style || this.atState <= -2;
	},
	//判断是否在水平线上
	IsOnHoriLead: function() {
		return this.atState <= -2 && (-this.atState)&1;
	},
	//判断是否在竖直线上
	IsOnVertLead: function() {
		return this.atState <= -2 && !( (-this.atState)&1 );
	},
	//判断是否在物体(结点或控件)上
	IsOnBody: function(isNotIncludeConnPoint/*true*/) {
		if (isNotIncludeConnPoint == undefined) isNotIncludeConnPoint = true;
		
		if (isNotIncludeConnPoint)	//判断是否在物体上,不包括连接点
			return -1 == this.atState && (BODY_CRUN == this.style || Pointer.IsCtrl(this.style));
		else		//判断是否在物体上,包括连接点
			return BODY_CRUN == this.style || Pointer.IsCtrl(this.style);
	},
	//判断是否在结点上
	IsOnCrun: function() {
		return BODY_CRUN == this.style;
	},
	//判断是否在控件上
	IsOnCtrl: function() {
		return Pointer.IsCtrl(this.style);
	},
	//判断是否在连接点上
	IsOnConnectPos: function() {
		return this.atState >= 1 && this.atState <= 4;
	},
	
	//指向导线
	SetOnLead: function(lead, isSetAt/*true*/) {
		if (isSetAt == undefined) isSetAt = true;
		
		this.p = lead;
		this.style = BODY_LEAD;
		if (isSetAt) this.atState = -2;
	},
	//指向结点
	SetOnCrun: function(crun, isSetAt/*true*/) {
		if (isSetAt == undefined) isSetAt = true;
		
		this.p = crun;
		this.style = BODY_CRUN;
		if (isSetAt) this.atState = -1;
	},
	//指向控件
	SetOnCtrl: function(ctrl, isSetAt) {
		this.p = ctrl;
		this.style = ctrl.style;	//这里控件必须初始化完毕
		if (isSetAt) this.atState = -1;
	},
	
	//判断当前物体是否指向这个导线
	IsLeadSame: function(other) {
		return this.IsOnLead() && this.p == other;
	},
	//判断当前物体是否指向这个结点
	IsCrunSame: function(other) {
		return this.IsOnCrun() && this.p == other;
	},
	//判断当前物体是否指向这个控件
	IsCtrlSame: function(other) {
		return this.IsOnCtrl() && this.p == other;
	},
	//判断两个Pointer是否指向同一个物体,不判断atState
	IsBodySame: function(other) {
		return (this.style == other.style) && (this.p == other.p);
	},
	//判断两个Pointer结构是否一样,判断atState
	IsAllSame: function(other) {
		return (this.atState == other.atState)&& (this.style == other.style) && (this.p == other.p);
	},
	//获得连接点对应的导线编号(0,1,2,3)
	GetLeadIndex: function() {
		return this.atState - 1;
	},
	// static函数
	IsCtrl: function(type) {
		return (type >= BODY_SOURCE) && (type <= BODY_SWITCH);
	},

	//从物体和连接点位置获得导线端点坐标
	GetPosFromBody: function() {
		var pos = {};
		var leadIndex = this.GetLeadIndex();

		if (this.IsOnCrun()) {	//连接结点
			pos.x = this.p.x;
			pos.y = this.p.y;
			switch (leadIndex) {
			case 0:	//在上端
				pos.y -= DD;
				break;
			case 1:	//在下端
				pos.y += DD - 1;	//显示存在坐标差(-1)
				break;
			case 2:	//在左端
				pos.x -= DD;
				break;
			case 3:	//在右端
				pos.x += DD - 1;	//显示存在坐标差(-1)
				break;
			}
		} else if (this.IsOnCtrl()) {	//连接控件
			pos.x = this.p.x;
			pos.y = this.p.y;
			if (0 == (this.p.dir & 1)) {	//横向
				pos.y += (CTRL_SIZE.cy>>1);
				if ((this.p.dir!=0) ^ (leadIndex!=0)) {	//在右端
					pos.x += CTRL_SIZE.cx - 1;	//显示存在坐标差(-1)
				}
			} else {	//纵向
				pos.x += (CTRL_SIZE.cx>>1);
				if (((this.p.dir-1)!=0) ^ (leadIndex!=0)) {	//在下端
					pos.y += CTRL_SIZE.cy - 1;	//显示存在坐标差(-1)
				}
			}
		}
		
		return pos;
	},

	//获得连接点位置
	GetConnectPosDir: function() {
		ASSERT(this.IsOnConnectPos());
		
		if (this.IsOnCrun()) {
			return this.atState;
		} else { //if (this.IsOnCtrl())
			ASSERT(this.p.dir >=0 && this.p.dir <= 3);

			if (this.atState == 1) {
				switch (this.p.dir) {
				case 0:
					return 3;
				case 1: 
					return 1;
				case 2:
					return 4;
				case 3: 
					return 2;
				}
			} else { //if (this.atState == 2)
				switch (this.p.dir) {
				case 0:
					return 4;
				case 1: 
					return 2;
				case 2:
					return 3;
				case 3: 
					return 1;
				}
			}

			return -1;
		}
	}

};
