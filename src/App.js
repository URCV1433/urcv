import React, {Component} from 'react';
import {
    Layout,
    Skeleton,
    Descriptions,
    Divider,
    notification,
    List,
    Tag,
    Avatar,
    Row,
    Col,
    Statistic,
    Button,
    Modal,
    ConfigProvider,
    Input,
    Rate,
    message, Form, InputNumber, Radio, Progress
} from "antd";

import {MiniProgress, Pie} from 'ant-design-pro/lib/Charts';
import 'ant-design-pro/dist/ant-design-pro.css';
import SelectAccount from "./component/SelectAccount"
import BigNumber from "bignumber.js"
import serojs from "serojs"

import "./App.css"
import copy from "copy-text-to-clipboard";
import QRCode from "qrcode";
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import Language from "./Lang"
import identicon from "identicon.js"
import Contract from "./component/contract"
// import popup from 'popup-js-sdk'
import seropp from 'sero-pp'

import Head from './head.png'

let ct = new Contract();
let Lang = new Language();
const {Header, Content, Footer} = Layout;


let contract = serojs.callContract(ct.abi, ct.address);

let decimal = new BigNumber(10).pow(18);
const {Countdown} = Statistic;

const openNotificationWithIcon = (type, message, desc) => {
    notification[type]({
        message: message,
        description: <p style={{wordBreak: 'normal', whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>{desc}</p>,
        duration: null,
    });
};


const InvestForm = Form.create({name: 'form_in_modal2'})(
    class extends React.Component {

        state = {
            confirmLoading: false,
            estimateReturn: 0,
            estimateLevel: 0,
            ticket: 0.000000,
            amount: 0.000000,
            total: 0.000000,
        }

        staticTotal() {
            let that = this;
            setTimeout(function () {
                let times = that.props.times;
                let total = new BigNumber(that.state.amount);

                let estimateLevel = 3;
                if (times > 0) {
                    estimateLevel = times;
                } else {
                    if (parseFloat(that.state.amount) >= 10 && parseFloat(that.state.amount) < 500) {
                        estimateLevel = 3
                    } else if (parseFloat(that.state.amount) >= 500 && parseFloat(that.state.amount) < 5000) {
                        estimateLevel = 4
                    } else if (parseFloat(that.state.amount) >= 5000) {
                        estimateLevel = 5
                    }
                }

                that.setState({
                    total: total.toFixed(6),
                    estimateLevel: estimateLevel
                })
            }, 10)
        }

        render() {
            const {visible, rate, sero, onCancel, onCreate, form, referId} = this.props;
            const {getFieldDecorator, setFieldsValue} = form;

            setTimeout(function () {
                if (referId && referId !== 0) {
                    setFieldsValue({"ReferId": referId});
                }
            }, 100)

            let that = this;
            return (
                <Modal
                    visible={visible}
                    title={Lang[that.props.lang].account.modal.invest.title}
                    onCancel={onCancel}
                    onOk={() => {
                        this.setState({
                            confirmLoading: true
                        });
                        setTimeout(function () {
                            onCreate(function (res) {
                                that.setState({
                                    confirmLoading: res
                                });
                            });
                        }, 10)
                    }}
                    confirmLoading={this.state.confirmLoading}
                >
                    <Form layout="vertical">
                        <Form.Item label={Lang[that.props.lang].account.modal.invest.referId}>
                            {getFieldDecorator(`ReferId`, {
                                rules: [{required: true, message: `Please Input Refer Id`}],
                            })(<Input style={{width: '60%'}} disabled={!(!referId || referId === 0)}
                                      placeholder={referId ? referId : ""} autoComplete="off"/>)}
                        </Form.Item>
                        <Form.Item
                            label={`${Lang[that.props.lang].account.modal.invest.amount} (Available Balance: ${sero} SERO)`}>
                            {getFieldDecorator('AmountSero', {
                                rules: [{required: true, message: `Please Input Amount! `}],
                            })(<InputNumber min={0} precision={6} max={parseFloat(sero)} step={100}
                                            style={{width: '60%'}} onChange={(v) => {
                                that.setState({amount: v});
                                that.staticTotal();
                            }} allowClear placeholder="0.000000" autoComplete="off"/>)}
                            <br/>SERO ({Lang[that.props.lang].account.modal.invest.amountTips})
                        </Form.Item>
                        <p>{Lang[that.props.lang].account.modal.invest.estimate}: <span
                            style={{color: '#1DA57A'}}>{that.state.amount}</span> (SERO) x <span
                            style={{color: '#1DA57A'}}>{that.state.estimateLevel} </span>(Times) = <strong
                            style={{color: 'rgb(216, 0, 38)'}}>{new BigNumber(that.state.amount).multipliedBy(that.state.estimateLevel).toFixed(6)} </strong>SERO
                        </p>

                        <p>{Lang[that.props.lang].account.modal.invest.total} : <strong
                            style={{color: 'rgb(216, 0, 38)'}}>{this.state.total}</strong> SERO</p>
                    </Form>
                </Modal>
            );
        }
    },
);


class ContentPage extends Component {

    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            showAccountSelect: false,
            showDeposit: false,
            showInvest: false,
            showShareProfit: false,
            showWithdraw: false,

            modal1Visible: false,

            currentAccount: {},
            balanceSero: 0,

            ct_id: 0,
            ct_details: {},

            lang: "zh_CN",
            winnerList: [],
            winnerPool: 0,
            preWinnerPool: 0,
        }
    }

    componentWillMount() {
        // let lang = localStorage.getItem("lang");
        // if (!lang) {
        //     lang = "zh_CN";
        //     localStorage.setItem("lang", "zh_CN");
        // }
        // this.setState({
        //     lang: lang,
        // })
        let that = this;
        seropp.init(ct.dapp, function (res) {
            if (res) {
                that.showSelectAccount();
                if (!that.state.showAccountSelect) {
                    setTimeout(function () {
                        that.getDetail();
                        that.getContractSeroBalance();
                        that.getWinners();
                    }, 3000)
                }
                seropp.getInfo(function (info) {
                    localStorage.setItem("lang", info.language);
                    that.setState({
                        lang: info.language,
                    })
                });

                setInterval(function () {
                    that.getDetail();
                    that.getContractSeroBalance();
                    that.getWinners();
                    if (that.state.currentAccount.PK) {
                        that.getAccount(that.state.currentAccount.PK)
                    }
                }, 60 * 1000)
            }
        });
    }

    showSelectAccount() {

        if (!this.state.currentAccount.PK) {
            let pk = localStorage.getItem("accountPk");
            if (pk) {
                this.getAccount(pk)
                this.setState({
                    loading: false
                })
            } else {
                this.setState({
                    showAccountSelect: true
                })
            }
        }
    }

    showDeposit() {

        this.setState({
            showDeposit: true
        })

        let canvas = document.getElementById('qrImg')
        QRCode.toCanvas(canvas, this.state.currentAccount.MainPKr, function (error) {
            if (error) console.error(error)
            console.log('success!');
        })
    }

    selectAccount = ac => {
        this.setState({
            currentAccount: ac,
            showAccountSelect: false,
            loading: false
        });
        localStorage.setItem("accountPk", ac.PK);
        window.location.reload();

    }

    hiddenAccount = () => {
        this.setState({
            showAccountSelect: false,
        });
    }

    onChange = checked => {
        this.setState({loading: !checked});
    };

    getContractSeroBalance() {
        let that = this;
        that.callMethod("balanceOfSero", [], function (res) {
            if (res) {
                that.setState({
                    ct_balanceOfSero: new BigNumber(res, 10).dividedBy(decimal).toFixed(6),
                })
            }
        })
    }

    //pullup
    getAccount(pk) {
        let that = this;
        seropp.getAccountDetail(pk, function (currentAccount) {
            let balanceSero = 0;
            let balanceObj = currentAccount.Balance;
            balanceObj.forEach(function (value, currency) {
                if (currency === 'SERO') {
                    balanceSero = new BigNumber(value).dividedBy(decimal).toFixed(6);
                }
            });

            let data = new identicon(pk, 200).toString();
            currentAccount["avatar"] = "data:image/png;base64," + data;
            that.setState({
                currentAccount: currentAccount,
                balanceSero: balanceSero,
            });
        });
    }


    getWinners() {
        let that = this;
        let winnerList = [];
        that.callMethod("winnerList", [], function (res) {
            if (res[0] !== "") {
                let codes = res[0].split(",");
                let values = res[1];
                for (var i = 0; i < codes.length; i++) {
                    winnerList.push({code: codes[i], value: values[i]});
                }
            }

            that.setState({
                winnerList: winnerList,
                preWinnerPool:res[2],
                winnerPool: res[3]
            })
        });
    }

    //=== contract

    getDetail() {
        let that = this;
        let res = that.callMethod("details", [], function (res) {
            let detail = {
                referId: "",
                largeAreaId: "",
                largeAreaTotal: new BigNumber("0").dividedBy(decimal).toFixed(6),
                amount: new BigNumber("0").dividedBy(decimal).toFixed(6),
                returnAmount: new BigNumber("0").dividedBy(decimal).toFixed(6),
                achievement: new BigNumber("0").dividedBy(decimal).toFixed(6),
                recommendNum: parseInt(new BigNumber("0").toString(10)),
                profitLevel: parseInt(new BigNumber("0").toString(10)),
                value: new BigNumber("0").dividedBy(decimal).toFixed(6),
                star: parseInt(new BigNumber("0").toString(10)),
                isVip: false,
            }
            if (res !== "0x0") {
                if (res) {
                    let data = res;
                    detail = {
                        referId: data[0] == 'JFVVW2ITNSJHF' ? "" : data[0],
                        largeAreaId: data[1] == 'JFVVW2ITNSJHF' ? "" : data[1],
                        largeAreaTotal: new BigNumber(data[2]).dividedBy(decimal).toFixed(6),
                        amount: new BigNumber(data[3]).dividedBy(decimal).toFixed(6),
                        returnAmount: new BigNumber(data[4]).dividedBy(decimal).toFixed(6),
                        achievement: new BigNumber(data[5]).dividedBy(decimal).toFixed(6),
                        recommendNum: parseInt(new BigNumber(data[6]).toString(10)),
                        profitLevel: parseInt(new BigNumber(data[7]).toString(10)),
                        value: new BigNumber(data[8]).dividedBy(decimal).toFixed(6),
                        star: parseInt(new BigNumber(data[9]).toString(10)),
                        isVip: data[10],
                    }
                }

            }
            that.callMethod("id", [], function (id) {
                detail["id"] = (id == "JFVVW2ITNSJHF" ? "" : id);
                that.callMethod("detailsOfIncome", [], function (detailsOfIncome) {
                    detail["detailsOfIncome"] = detailsOfIncome;
                    that.callMethod("calcuStaticProfit", [], function (calcuStaticProfit) {
                        if (calcuStaticProfit === '0x') {
                            calcuStaticProfit = "0";
                        }
                        detail["dayProfit"] = new BigNumber(calcuStaticProfit).dividedBy(decimal).toFixed(2);

                        console.log("dayProfit", detail["dayProfit"].toString());
                        that.setState({
                            ct_details: detail
                        })
                    });

                });
            });

        });

    }


    callMethod(_method, args, callback) {

        let packData = contract.packData(_method, args);
        let callParams = {
            from: this.state.currentAccount.MainPKr,
            to: ct.address,
            data: packData
        };

        seropp.call(callParams, function (callData, error) {
            if (error) {
                console.log("error::", error);
            } else {
                let res = contract.unPackData(_method, callData);
                callback(res);
            }
        });
    }

    executeMethod(_method, args, value, cy, password, callback) {
        let that = this;

        let packData = contract.packData(_method, args);
        let executeData = {
            from: that.state.currentAccount.PK,
            to: ct.address,
            value: "0x" + value,//SERO
            data: packData,
            gas_price: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };
        let estimateParam = {
            from: that.state.currentAccount.MainPKr,
            to: ct.address,
            value: "0x" + value,//SERO
            data: packData,
            gas_price: "0x" + new BigNumber("1000000000").toString(16),
            cy: cy,
        };
        // executeData["gas"] = pullup.sero.estimateGas(estimateParam);
        seropp.estimateGas(estimateParam, function (gas, error) {
            if (error) {
                message.error(error);
            } else {
                executeData["gas"] = gas;
                seropp.executeContract(executeData, function (res) {
                    callback(res);
                });
            }
        });
    }


    handleCancel = () => {
        this.setState({
            showDeposit: false
        })
    }

    //====  buyAsnow begin
    handleBuyAsnowCancel = () => {
        this.setState({showBuyAsnow: false});
    };

    handleBuyAsnowCreate = (cb) => {
        let that = this;
        const {form} = this.formRef.props;
        form.validateFields((err, values) => {
            if (err) {
                if (cb) {
                    cb(false)
                }
                return;
            }
            let amount = form.getFieldValue("Amount");
            try {
                this.executeMethod("buyAsnow", [], new BigNumber(amount).multipliedBy(decimal).toString(16), "SERO", '', function (res) {
                    if (res) {
                        form.resetFields();
                        that.setState({showBuyAsnow: false});
                        setTimeout(function () {
                            openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                        }, 3000)
                    }
                    if (cb) {
                        cb(false)
                    }
                });
            } catch (err) {
                if (err) {
                    message.error(err.message);
                } else {
                    message.error("request SERO Node error:[" + err.message + "]");
                }
                if (cb) {
                    cb(false)
                }
            }

        });
    };

    //====  buyAsnow end

    //====  Invest begin
    handleInvestCancel = () => {
        this.setState({showInvest: false});
    };

    handleInvestCreate = (cb) => {
        let that = this;
        const {form} = this.formRef2.props;
        form.validateFields((err, values) => {
            if (err) {
                if (cb) {
                    cb(false)
                }
                return;
            }
            let amountSero = form.getFieldValue("AmountSero");
            // let ticketSero=form.getFieldValue("TicketSero");
            let referId = form.getFieldValue("ReferId");
            let password = form.getFieldValue("Password");


            if (that.state.ct_details.referId) {
                referId = that.state.ct_details.referId;
            }
            if (new BigNumber(amountSero).comparedTo(new BigNumber(this.state.balanceSero)) > 0) {
                if (cb) {
                    cb(false)
                }
                message.warn(Lang[that.state.lang].toast.lessAmount);
            } else if (parseFloat(amountSero) < 10) {
                if (cb) {
                    cb(false)
                }
                message.warn(Lang[that.state.lang].toast.minInvest);
            } else {
                try {
                    this.executeMethod("invest", [referId], new BigNumber(amountSero).multipliedBy(decimal).toString(16), "SERO", password, function (res) {
                        if (res) {
                            form.resetFields();
                            that.setState({showInvest: false});
                            setTimeout(function () {
                                openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                            }, 3000)
                        }
                        if (cb) {
                            cb(false)
                        }
                    });
                } catch (err) {
                    if (err) {
                        message.error(err.message);
                    } else {
                        message.error("request SERO Node error:[" + err.message + "]");
                    }
                    if (cb) {
                        cb(false)
                    }
                }
            }
        });
    };

    saveInvestFormRef = formRef => {
        this.formRef2 = formRef;
    };

    //====  Invest end

    shareProfit() {
        let that = this;
        try {
            this.executeMethod("triggerStaticProfit", [], "0", "SERO", '', function (res) {
                if (res) {
                    openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                } else {
                    if (res.error) {
                        message.error(res.error.message);
                    } else {
                        message.error("request SERO Node error:[" + res + "]");
                    }
                }
            });
        } catch (err) {
            if (err) {
                message.error(err.message);
            } else {
                message.error("request SERO Node error:[" + err.message + "]");
            }
        }

    }

    withdraw() {
        let that = this;
        try {
            this.executeMethod("withdrawBalance", [], "0", "SERO", '', function (res) {
                if (res) {
                    openNotificationWithIcon('success', 'Successful', `${Lang[that.state.lang].toast.tx}${res}`)
                } else {
                    if (res.error) {
                        message.error(res.error.message);
                    } else {
                        message.error("request SERO Node error:[" + res + "]");
                    }
                }
            });
        } catch (err) {
            if (err) {
                message.error(err.message);
            } else {
                message.error("request SERO Node error:[" + err.message + "]");
            }
        }
    }


    showRules = () => {
        let that = this;
        Modal.info({
            title: <span style={{color: "#f3ba44", fontWeight: "600"}}>{Lang[that.state.lang].project.rule}</span>,
            okText: "OK",
            icon: "",
            content: <div>
                <span style={{'whiteSpace': 'pre-wrap', color: "#FFFFFF"}}>{Lang[that.state.lang].toast.rule}</span>
                <a className='copyTxt' onClick={() => {
                    copy("IFVUSKIRFSIDF");
                    message.success('Copy to clipboard successfully');
                }}>{Lang[this.state.lang].account.modal.deposit.copy}</a>
                <br/>
            </div>
        })
    }
    //==== Buy Ticket begin


    //==== Buy Ticket end

    render() {
        const {loading, showAccountSelect, currentAccount} = this.state;
        let accountName = currentAccount.PK;
        let that = this;
        let staticReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[0]).dividedBy(decimal).toFixed(2) : 0;
        let recommendReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[1]).dividedBy(decimal).toFixed(2) : 0;
        let nobilityReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[2]).dividedBy(decimal).toFixed(2) : 0;
        let vipReward = that.state.ct_details.detailsOfIncome ? new BigNumber(that.state.ct_details.detailsOfIncome[3]).dividedBy(decimal).toFixed(2) : 0;
        // let currentIncome = that.state.ct_details.detailsOfIncome?new BigNumber(that.state.ct_details.detailsOfIncome[4]).dividedBy(decimal).toFixed(2):0;
        let staticTimestamp = that.state.ct_details.detailsOfIncome ? that.state.ct_details.detailsOfIncome[5] : 0;

        const salesPieData = [
            {
                x: Lang[this.state.lang].account.title.staticReward,
                y: parseFloat(staticReward),
            },
            {
                x: Lang[this.state.lang].account.title.recommendReward,
                y: parseFloat(recommendReward),
            },
            {
                x: Lang[this.state.lang].account.title.nobilityReward,
                y: parseFloat(nobilityReward),
            },
            {
                x: Lang[this.state.lang].account.title.vipReward,
                y: parseFloat(vipReward),
            },

        ];

        const showChart = parseFloat(staticReward) > 0 || parseFloat(recommendReward) > 0 || parseFloat(nobilityReward) > 0 || parseFloat(vipReward) > 0
        const countDown = nextShareTime();
        let totalReturnDay = this.state.ct_balanceOfSero ? new BigNumber(this.state.ct_balanceOfSero).dividedBy(30).toFixed(6) : "0";
        let returnPercent = 0;

        if (this.state.ct_details.returnAmount && parseFloat(this.state.ct_details.returnAmount) > 0) {
            let a = parseFloat(this.state.ct_details.returnAmount);
            let b = new BigNumber(this.state.ct_details.amount).multipliedBy(this.state.ct_details.profitLevel).toString(10);
            returnPercent = (a * 100 / parseFloat(b)).toFixed(2);
        }

        let showCountDown = new Date(staticTimestamp * 1000).getUTCDate() === parseInt(new Date().getUTCDate());
        // let showCountDown = Math.ceil((staticTimestamp * 1000) / (1200 * 1000)) === nextShareTime() / (1200 * 1000);
        let rank = 0;
        let winners = that.state.winnerList.map((item, i) => {
            if (item.code === that.state.ct_details.id) {
                rank = i + 1;
            }
            return (
                <Row key={i}>
                    <Col span={8}><img src={require("./URCV_li_" + (i + 1) + ".png")}
                                       style={{width: '30px', height: '25px'}}/></Col>
                    <Col span={8}>{item.code.slice(0,5)+".."+item.code.slice(-5)}</Col>
                    <Col span={8}>{new BigNumber(item.value).dividedBy(decimal).toFixed(2)}</Col>
                </Row>
            )
        });

        return (
            <div className="App" style={{marginTop: '0px'}}>
                <div className="content-n">
                    <div className="header-n">
                        <img src={Head} width={"100%"}/>
                        <span style={{
                            float: "left",
                            padding: "15px",
                            position: "relative",
                            top: "-200px",
                            color: "#f3ba44",
                            fontWeight: "600"
                        }} onClick={this.showRules.bind(this)}>{Lang[this.state.lang].project.rule}</span>
                    </div>
                    <div className="account-n">
                        <div className="trapezoid">{Lang[this.state.lang].account.title.utxo}</div>
                        <div className={"account-nr"}>
                            <Row>
                                <Col span={16}>

                                    <List.Item.Meta
                                        title={
                                            <span>{accountName ? accountName.slice(0, 10) + "..." + accountName.slice(-10) : ""}</span>
                                        }
                                        description={
                                            <Rate count={5}
                                                  value={this.state.ct_details.star ? this.state.ct_details.star : 0}
                                                  disabled/>
                                        }
                                    />
                                </Col>
                                <Col span={4} style={{textAlign: 'right'}}>
                                    <Button type={"primary"}
                                            onClick={() => {
                                                this.setState({
                                                    showAccountSelect: true
                                                })
                                            }}>{Lang[this.state.lang].account.title.swith}</Button>
                                </Col>
                            </Row>
                            <Row>
                                <p style={{textAlign: 'center', marginTop: '5px', fontSize: '18px'}}>
                                    {this.state.balanceSero} SERO
                                </p>
                            </Row>
                            <p style={{textAlign: 'center'}}>
                                <Button type={"primary"} onClick={() => this.showDeposit()}>充值</Button>
                            </p>
                        </div>
                    </div>
                    <div className={"contract-tn"}>
                        <div className={"contract-dn"}>
                            <div className="trapezoid">{Lang[this.state.lang].account.title.contract}</div>
                            <div className="contract-n">

                                <div style={{textAlign: 'center'}}>
                                    <p/>
                                    <div>
                                        <span
                                            className={"spanx"}>{Lang[this.state.lang].account.title.estimatedTotal}:{new BigNumber(this.state.ct_details.amount ? this.state.ct_details.amount : 0).multipliedBy(this.state.ct_details.profitLevel ? this.state.ct_details.profitLevel : 0).toFixed(2)}</span>
                                    </div>
                                    <p/>
                                    <div style={{textAlign: 'center'}}>
                                        <Button type={"primary"} onClick={() => {
                                            this.setState({showInvest: true})
                                        }}>{Lang[this.state.lang].account.button.invest}</Button>
                                    </div>

                                </div>

                                <div style={{textAlign: 'center'}}>
                                    <p/>
                                    <Row>
                                        <Col span={12}>
                                            <div><span
                                                className={"spanx"}>{Lang[this.state.lang].account.title.staticIncome} </span>
                                            </div>
                                            <div>
                                                <span className={"spanx"}>
                                                    {this.state.ct_details.dayProfit ?
                                                        this.state.ct_details.dayProfit : 0.00}
                                                </span>
                                            </div>
                                            <div>
                                                {
                                                    showCountDown ?
                                                        <Countdown style={{marginTop: 14}} title="" format="HH:mm:ss"
                                                                   value={parseFloat(countDown)} onFinish={() => {
                                                            this.getDetail()
                                                        }}/> : <Button style={{marginTop: 16}} type="primary"
                                                                       disabled={showCountDown} onClick={() => {
                                                            this.shareProfit()
                                                        }}>{Lang[this.state.lang].account.button.trigger}</Button>
                                                }
                                            </div>
                                        </Col>

                                        <Col span={12}>
                                            <div>
                                                <span
                                                    className={"spanx"}>{Lang[this.state.lang].account.title.withdraw}
                                                    </span>
                                            </div>
                                            <div>
                                                 <span className={"spanx"}>
                                                     {new BigNumber(this.state.ct_details.value ?
                                                         this.state.ct_details.value : 0).toFixed(2)}
                                                 </span>

                                            </div>
                                            <div>
                                                <Button style={{marginTop: 16}}
                                                        disabled={new BigNumber(this.state.ct_details.value ? this.state.ct_details.value : 0).comparedTo(0) < 1}
                                                        type="primary" onClick={() => {
                                                    this.withdraw()
                                                }}>{Lang[this.state.lang].account.button.withdraw}</Button>
                                            </div>

                                        </Col>
                                    </Row>
                                </div>
                                {
                                    showChart && <Divider dashed={true}/>
                                }

                                <div>{
                                    showChart && <Row>
                                        <Col span={24}>
                                            <div>
                                                <span>
                                                    {Lang[this.state.lang].account.title.totalReturn}:{returnPercent}%
                                                </span>
                                            </div>
                                            <div style={{padding: '5px'}}>
                                                <MiniProgress percent={returnPercent} strokeWidth={8} target={80}/>
                                            </div>
                                            <div>
                                                <span>
                                                    {Lang[this.state.lang].account.title.totalReturn}
                                                </span>
                                            </div>
                                            <div style={{padding: '5px'}}>
                                                <Pie
                                                    hasLegend
                                                    animate
                                                    title={Lang[this.state.lang].account.title.totalReturn}
                                                    subTitle={Lang[this.state.lang].account.title.totalReturn}
                                                    total={() => (
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: salesPieData.reduce((pre, now) => now.y + pre, 0),
                                                            }}
                                                        />
                                                    )}
                                                    data={salesPieData}
                                                    valueFormat={val => <span
                                                        dangerouslySetInnerHTML={{__html: val}}/>}
                                                    height={248}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                }
                                </div>
                                <Divider dashed={true}/>
                                <div style={{textAlign: 'center'}}>
                                    <Row>
                                        <Col span={12}>
                                            <Statistic title={Lang[this.state.lang].account.title.totalReturnDay}
                                                       value={totalReturnDay} precision={2}/>
                                        </Col>
                                        <Col span={12}>
                                            <Statistic title={Lang[this.state.lang].account.title.dayIncome}
                                                       value={this.state.ct_details.dayProfit && parseFloat(totalReturnDay) > 0 ? new BigNumber(this.state.ct_details.dayProfit).multipliedBy(100).dividedBy(totalReturnDay).toFixed(2) : "0"}
                                                       suffix={"%"}/>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <p/>
                                        <Col span={12}>
                                            <Statistic title={Lang[this.state.lang].account.title.areaTotal}
                                                       value={this.state.ct_details.largeAreaTotal} precision={2}/>
                                        </Col>
                                        <Col span={12}>
                                            <Statistic title={Lang[this.state.lang].account.title.areaOtherTotal}
                                                       value={new BigNumber(this.state.ct_details.achievement).minus(new BigNumber(this.state.ct_details.largeAreaTotal)).toFixed(2)}
                                                       precision={2}/>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={"contract-tn"}>
                        <div className={"contract-dn"}>
                            <div className="trapezoid">{Lang[this.state.lang].winner.title}</div>
                            <div className="contract-n">
                                <div style={{textAlign: 'center'}}>
                                    <Row key={"title"}>
                                        <Col span={8}>{Lang[this.state.lang].winner.ranking}</Col>
                                        <Col span={8}>{Lang[this.state.lang].winner.code}</Col>
                                        <Col span={8}>{Lang[this.state.lang].winner.reward}</Col>
                                    </Row>
                                    {winners}
                                </div>
                                <Divider dashed={true}/>
                                <div>
                                    <div className="countDown">
                                        <Row style={{color: "red"}}>
                                            <Col span={14} style={{textAlign: 'right', fontSize: '16px'}}>
                                                <span>{Lang[this.state.lang].winner.countDown}&nbsp;&nbsp;&nbsp;</span></Col>
                                            <Col span={10}><Countdown title="" format="HH:mm:ss"
                                                                      value={parseFloat(countDown)}/></Col>
                                        </Row>
                                    </div>

                                    <Descriptions style={{paddingTop: '10px'}}>
                                        <Descriptions.Item
                                            label={<span
                                                style={{color: "#3f2908"}}>{Lang[this.state.lang].winner.poolValue}</span>}>
                                            <span
                                                style={{color: "#3f2908"}}>{new BigNumber(this.state.preWinnerPool).dividedBy(decimal).toFixed(2)}</span></Descriptions.Item>
                                        <Descriptions.Item
                                            label={<span
                                                style={{color: "#3f2908"}}>今日冠军奖池(SERO)</span>}>
                                            <span
                                                style={{color: "#3f2908"}}>{new BigNumber(this.state.winnerPool).dividedBy(decimal).toFixed(2)}</span></Descriptions.Item>
                                        <Descriptions.Item
                                            label={<span
                                                style={{color: "#3f2908"}}>{Lang[this.state.lang].winner.myplace}</span>}>{
                                            rank > 0 ? <span style={{color: "#3f2908"}}>{rank}</span> :
                                                <span style={{color: "#3f2908"}}></span>
                                        }</Descriptions.Item>
                                        <Descriptions.Item
                                            label={<span
                                                style={{color: "#3f2908"}}>{Lang[this.state.lang].winner.myreward}</span>}>{
                                            rank == 0 ? <span style={{color: "#3f2908"}}>0.00</span> :
                                                <span
                                                    style={{color: "#3f2908"}}>{new BigNumber(this.state.winnerList[rank - 1].value).dividedBy(decimal).toFixed(2)}</span>
                                        }</Descriptions.Item>

                                    </Descriptions>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contract-detail-n" style={{color: "#fff"}}>
                        <Skeleton loading={loading}>
                            <Descriptions
                                title={<h2 style={{color: '#fff'}}>{Lang[this.state.lang].project.title}</h2>}>
                                <Descriptions.Item label={Lang[this.state.lang].project.contractAddress}>
                                    <small style={{color: '#fff'}}>{ct.address}</small>
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider dashed={true}/>
                            <Descriptions title={<h4
                                style={{color: '#fff'}}>{Lang[this.state.lang].account.title.investDetail}</h4>}>
                                <Descriptions.Item
                                    label={<span
                                        style={{color: '#fff'}}>{Lang[this.state.lang].account.title.id}</span>}><span
                                    style={{color: '#fff'}}>{this.state.ct_details.id}</span></Descriptions.Item>
                                <Descriptions.Item style={{color: '#fff'}}
                                                   label={<span
                                                       style={{color: '#fff'}}>{Lang[this.state.lang].account.title.referId}</span>}><span
                                    style={{color: '#fff'}}>{this.state.ct_details.referId}</span></Descriptions.Item>
                                <Descriptions.Item style={{color: '#fff'}}
                                                   label={<span
                                                       style={{color: '#fff'}}>{Lang[this.state.lang].account.title.areaId}</span>}><span
                                    style={{color: '#fff'}}>{this.state.ct_details.largeAreaId}</span></Descriptions.Item>
                                <Descriptions.Item style={{color: '#fff'}}
                                                   label={<span
                                                       style={{color: '#fff'}}>{Lang[this.state.lang].account.title.totalInvest}</span>}><span
                                    style={{color: '#fff'}}>{this.state.ct_details.amount}</span></Descriptions.Item>
                                <Descriptions.Item style={{color: '#fff'}}
                                                   label={<span
                                                       style={{color: '#fff'}}>{Lang[this.state.lang].account.title.profitLevel}</span>}><span
                                    style={{color: '#fff'}}>{this.state.ct_details.profitLevel}</span></Descriptions.Item>
                                <Descriptions.Item style={{color: '#fff'}}
                                                   label={<span
                                                       style={{color: '#fff'}}>{Lang[this.state.lang].account.title.latestTime}</span>}><span
                                    style={{color: '#fff'}}>{convertUTCDate(staticTimestamp)}</span></Descriptions.Item>
                            </Descriptions>
                        </Skeleton>
                    </div>
                </div>
                <div className="footer-n">
                    <span>风险投资, 风险自控</span>
                </div>

                <SelectAccount visible={showAccountSelect} selectAccount={this.selectAccount}
                               hiddenAccount={this.hiddenAccount}/>

                <Modal
                    title={Lang[this.state.lang].account.modal.deposit.title}
                    visible={this.state.showDeposit}
                    onCancel={this.handleCancel}
                    footer={null}
                    getContainer={false}
                >
                    <div style={{textAlign: "center"}}>
                        <canvas id="qrImg"></canvas>
                        <p style={{wordBreak: 'normal', whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>
                            <small>{this.state.currentAccount.MainPKr}</small></p>
                        <Button className='copyTxt' type="primary" onClick={() => {
                            copy(this.state.currentAccount.MainPKr);
                            message.success('Copy to clipboard successfully');
                        }}>{Lang[this.state.lang].account.modal.deposit.copy}</Button>
                    </div>
                </Modal>


                <InvestForm
                    wrappedComponentRef={this.saveInvestFormRef}
                    visible={this.state.showInvest}
                    onCancel={this.handleInvestCancel}
                    onCreate={this.handleInvestCreate}
                    sero={this.state.balanceSero}
                    asnow={this.state.ct_details.asnowBalances}
                    // calcuPrincipalProfit={this.calcuPrincipalProfit}
                    lang={this.state.lang}
                    times={this.state.ct_details.profitLevel}
                    referId={this.state.ct_details.referId}
                />


            </div>
        );
    }
}


class App extends Component {
    constructor() {
        super();
        this.state = {
            locale: zhCN,
        };
    }

    componentWillMount() {
        let lang = localStorage.getItem("lang");
        let locale = zhCN;
        if (lang) {
            if (lang === "zh_CN") {
                locale = zhCN;
            } else if (lang === "en_US") {
                locale = enUS;
            }
        } else {
            locale = zhCN;
            localStorage.setItem("lang", "zh_CN");
        }

        this.setState({
            locale: locale
        })
    }

    changeLocale = e => {
        const localeValue = e.target.value;
        this.setState({locale: localeValue});
        if (localeValue.locale === "en") {
            localStorage.setItem("lang", "en_US");
        } else if (localeValue.locale === "zh-cn") {
            localStorage.setItem("lang", "zh_CN");
        }
    };

    render() {
        const {locale} = this.state;
        return (
            <div className="App" style={{height: document.documentElement.clientHeight}}>
                <Layout className="layout">
                    {/*<Header className="header">*/}
                    {/*    <div className="logo"><img src={logo}/></div>*/}
                    {/*    <div className="change-locale">*/}
                    {/*        <Radio.Group value={locale} onChange={this.changeLocale}>*/}
                    {/*            <Radio.Button key="en" value={enUS}>*/}
                    {/*                English*/}
                    {/*            </Radio.Button>*/}
                    {/*            <Radio.Button key="cn" value={zhCN}>*/}
                    {/*                中文*/}
                    {/*            </Radio.Button>*/}
                    {/*        </Radio.Group>*/}
                    {/*    </div>*/}
                    {/*</Header>*/}

                    <ConfigProvider locale={locale}>
                        <ContentPage key={locale ? locale.locale : 'en'}/>
                    </ConfigProvider>
                    <Footer style={{textAlign: 'center'}}/>
                </Layout>
            </div>
        );
    }
}

function convertUTCDate(dateTimestamp) {
    if (dateTimestamp && dateTimestamp > 0) {
        let cDate = new Date(dateTimestamp * 1000);
        return appendZero(cDate.getMonth() + 1) + "/" + appendZero(cDate.getDate()) + " " + appendZero(cDate.getHours()) + ":" + appendZero(cDate.getMinutes());
    }
    return ""
}

function nextShareTime() {
    let d = new Date();
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000);
    let year = d.getUTCFullYear();
    let month = d.getUTCMonth();
    let day = d.getUTCDate();

    d = new Date(year, month, day, 0, 0, 0);

    let tz = new Date().getTimezoneOffset() / 60;
    return d.getTime() + (-tz) * 60 * 60 * 1000;
}

function appendZero(i) {
    i = i < 10 ? "0" + i : i;
    return i;
}

export default App;

