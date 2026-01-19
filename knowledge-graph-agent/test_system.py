"""
系统测试脚本
验证各个组件是否正常工作
"""
import asyncio
import sys
import os

# 添加backend到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from agent_service.llm_client import LLMClient
from agent_service.validator import ValidationLayer
from agent_service.agent import AgentService


async def test_llm_client():
    """测试LLM客户端"""
    print("\n" + "="*50)
    print("测试 1: LLM客户端")
    print("="*50)
    
    try:
        client = LLMClient()
        
        # 简单测试
        response = await client.call_llm(
            prompt="请用一句话解释什么是熵",
            temperature=0.3,
            max_tokens=100
        )
        
        print(f"✅ LLM调用成功")
        print(f"响应: {response[:100]}...")
        return True
        
    except Exception as e:
        print(f"❌ LLM调用失败: {str(e)}")
        return False


async def test_concept_identification():
    """测试概念识别"""
    print("\n" + "="*50)
    print("测试 2: 概念识别")
    print("="*50)
    
    try:
        agent = AgentService()
        
        result = await agent._identify_concept("熵")
        
        print(f"✅ 概念识别成功")
        print(f"概念: {result.get('concept')}")
        print(f"学科: {result.get('primary_domain')}")
        print(f"定义: {result.get('definition')}")
        return True
        
    except Exception as e:
        print(f"❌ 概念识别失败: {str(e)}")
        return False


async def test_cross_domain_mining():
    """测试跨学科挖掘"""
    print("\n" + "="*50)
    print("测试 3: 跨学科关联挖掘")
    print("="*50)
    
    try:
        agent = AgentService()
        
        concept_info = {
            "concept": "熵",
            "primary_domain": "物理学",
            "definition": "衡量系统无序程度的物理量"
        }
        
        relations = await agent._mine_cross_domain_relations(concept_info)
        
        print(f"✅ 跨学科挖掘成功")
        print(f"发现 {len(relations)} 个关系")
        
        if relations:
            print(f"\n示例关系:")
            rel = relations[0]
            print(f"  源: {rel.get('source_concept')}")
            print(f"  目标: {rel.get('target_concept')} ({rel.get('target_domain')})")
            print(f"  类型: {rel.get('relation_type')}")
            print(f"  强度: {rel.get('relation_strength')}/10")
        
        return True
        
    except Exception as e:
        print(f"❌ 跨学科挖掘失败: {str(e)}")
        return False


async def test_validation():
    """测试校验层"""
    print("\n" + "="*50)
    print("测试 4: 校验层")
    print("="*50)
    
    try:
        client = LLMClient()
        validator = ValidationLayer(client)
        
        result = await validator.validate_relation(
            source_concept="熵",
            source_domain="物理学",
            target_concept="香农熵",
            target_domain="计算机科学",
            relation_type="类比应用",
            explanation="香农将热力学熵的概念引入信息论"
        )
        
        print(f"✅ 校验层测试成功")
        print(f"验证结果: {'有效' if result['valid'] else '无效'}")
        print(f"置信度: {result['confidence']:.2f}")
        
        return True
        
    except Exception as e:
        print(f"❌ 校验层测试失败: {str(e)}")
        return False


async def test_full_pipeline():
    """测试完整流程"""
    print("\n" + "="*50)
    print("测试 5: 完整知识图谱生成")
    print("="*50)
    
    try:
        agent = AgentService()
        
        print("正在生成知识图谱（这可能需要30-60秒）...")
        
        result = await agent.generate_knowledge_graph(
            concept="神经网络",
            enable_validation=True
        )
        
        if result.get('success'):
            print(f"✅ 知识图谱生成成功")
            stats = result.get('stats', {})
            print(f"节点数: {stats.get('total_nodes', 0)}")
            print(f"边数: {stats.get('total_edges', 0)}")
            print(f"学科数: {stats.get('domains_covered', 0)}")
            return True
        else:
            print(f"❌ 知识图谱生成失败: {result.get('error')}")
            return False
        
    except Exception as e:
        print(f"❌ 完整流程测试失败: {str(e)}")
        return False


async def main():
    """主测试函数"""
    print("\n" + "="*60)
    print("  跨学科知识图谱智能体 - 系统测试")
    print("="*60)
    
    # 检查环境变量
    if not os.getenv("OPENAI_API_KEY"):
        print("\n❌ 错误: 未设置 OPENAI_API_KEY 环境变量")
        print("请在 .env 文件中设置或导出环境变量")
        return
    
    print(f"\n✅ 环境变量已配置")
    print(f"API Key: {os.getenv('OPENAI_API_KEY')[:10]}...")
    
    # 运行测试
    tests = [
        ("LLM客户端", test_llm_client),
        ("概念识别", test_concept_identification),
        ("跨学科挖掘", test_cross_domain_mining),
        ("校验层", test_validation),
        ("完整流程", test_full_pipeline),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = await test_func()
            results.append((name, result))
        except KeyboardInterrupt:
            print("\n\n⚠️  测试被用户中断")
            break
        except Exception as e:
            print(f"\n❌ 测试异常: {str(e)}")
            results.append((name, False))
    
    # 输出总结
    print("\n" + "="*60)
    print("  测试总结")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} - {name}")
    
    print(f"\n总计: {passed}/{total} 测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！系统运行正常。")
    else:
        print(f"\n⚠️  {total - passed} 个测试失败，请检查配置和日志。")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n测试被中断")
    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()

